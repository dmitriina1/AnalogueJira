from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from models import db, User, Board, List, Card, Label, Checklist, ChecklistItem, Comment, card_labels
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///planka.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

def get_or_create_user_board(user_id):
    """Получить или создать доску для пользователя"""
    board = Board.query.filter_by(user_id=user_id).first()
    if not board:
        board = Board(
            name="My Trello Board",
            description="My personal task board",
            background_color="#0079bf",
            user_id=user_id
        )
        db.session.add(board)
        db.session.flush()  # Получаем ID доски без коммита
        
        # Создаем начальные списки
        lists = ['To Do', 'In Progress', 'Done']
        for i, name in enumerate(lists):
            new_list = List(name=name, position=i, board_id=board.id)
            db.session.add(new_list)
        
        # Создаем начальные метки
        labels = [
            {'name': 'Bug', 'color': '#eb5a46'},
            {'name': 'Feature', 'color': '#61bd4f'},
            {'name': 'Improvement', 'color': '#0079bf'}
        ]
        for label_data in labels:
            label = Label(
                name=label_data['name'],
                color=label_data['color'],
                board_id=board.id  # Теперь board.id доступен
            )
            db.session.add(label)
        
        db.session.commit()
    return board

@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for('dashboard'))
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        
        if User.query.filter_by(username=username).first():
            return "Username already exists"
        
        user = User(username=username, email=email)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        # Создаем доску для нового пользователя
        get_or_create_user_board(user.id)
        
        login_user(user)
        return redirect(url_for('dashboard'))
    
    return render_template('login.html', register=True)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    # Получаем или создаем доску для текущего пользователя
    board = get_or_create_user_board(current_user.id)
    
    # Получаем все списки доски с их карточками
    lists = List.query.filter_by(board_id=board.id, is_archived=False).order_by(List.position).all()
    for list_obj in lists:
        list_obj.cards = Card.query.filter_by(list_id=list_obj.id, is_archived=False).order_by(Card.position).all()
        for card in list_obj.cards:
            card.labels_list = card.labels
            card.checklists_list = Checklist.query.filter_by(card_id=card.id).order_by(Checklist.position).all()
            for checklist in card.checklists_list:
                checklist.items_list = ChecklistItem.query.filter_by(checklist_id=checklist.id).order_by(ChecklistItem.position).all()
    
    # Получаем всех пользователей для назначения
    users = User.query.all()
    # Получаем метки доски
    labels = Label.query.filter_by(board_id=board.id).all()
    
    return render_template('dashboard.html', lists=lists, users=users, labels=labels, board=board, now=datetime.utcnow())

# API Routes
@app.route('/api/lists', methods=['POST'])
@login_required
def create_list():
    data = request.get_json()
    board = get_or_create_user_board(current_user.id)
    
    # Получаем максимальную позицию для нового списка
    max_position = db.session.query(db.func.max(List.position)).filter_by(board_id=board.id).scalar() or 0
    
    list_obj = List(
        name=data['name'],
        position=max_position + 1,
        board_id=board.id
    )
    db.session.add(list_obj)
    db.session.commit()
    return jsonify({'id': list_obj.id, 'name': list_obj.name})

@app.route('/api/lists/<int:list_id>/cards', methods=['POST'])
@login_required
def create_card(list_id):
    data = request.get_json()
    
    # Проверяем, что список принадлежит текущему пользователю
    list_obj = List.query.get_or_404(list_id)
    board = get_or_create_user_board(current_user.id)
    if list_obj.board_id != board.id:
        return jsonify({'error': 'Access denied'}), 403
    
    # Получаем максимальную позицию для новой карточки
    max_position = db.session.query(db.func.max(Card.position)).filter_by(list_id=list_id).scalar() or 0
    
    # Обрабатываем due_date
    due_date = None
    if data.get('due_date'):
        try:
            due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
        except:
            due_date = datetime.strptime(data['due_date'], '%Y-%m-%d')
    
    card = Card(
        title=data['title'],
        description=data.get('description', ''),
        list_id=list_id,
        position=max_position + 1,
        reporter_id=current_user.id,
        assignee_id=data.get('assignee_id'),
        due_date=due_date,
        time_estimate=data.get('time_estimate')
    )
    db.session.add(card)
    db.session.commit()
    
    # Добавляем метки если предоставлены
    if 'label_ids' in data:
        for label_id in data['label_ids']:
            label = Label.query.get(label_id)
            if label and label.board_id == board.id:
                card.labels.append(label)
    
    db.session.commit()
    
    return jsonify({
        'id': card.id, 
        'title': card.title
    })

@app.route('/api/cards/<int:card_id>', methods=['PUT'])
@login_required
def update_card(card_id):
    card = Card.query.get_or_404(card_id)
    
    # Проверяем, что карточка принадлежит пользователю
    list_obj = List.query.get_or_404(card.list_id)
    board = get_or_create_user_board(current_user.id)
    if list_obj.board_id != board.id:
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.get_json()
    
    if 'title' in data:
        card.title = data['title']
    if 'description' in data:
        card.description = data['description']
    if 'list_id' in data:
        card.list_id = data['list_id']
    if 'position' in data:
        card.position = data['position']
    if 'assignee_id' in data:
        card.assignee_id = data['assignee_id']
    if 'due_date' in data:
        due_date = None
        if data['due_date']:
            try:
                due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
            except:
                due_date = datetime.strptime(data['due_date'], '%Y-%m-%d')
        card.due_date = due_date
    if 'time_estimate' in data:
        card.time_estimate = data['time_estimate']
    
    card.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({'message': 'Card updated'})

@app.route('/api/cards/<int:card_id>/labels', methods=['POST'])
@login_required
def add_label_to_card(card_id):
    card = Card.query.get_or_404(card_id)
    
    # Проверяем, что карточка принадлежит пользователю
    list_obj = List.query.get_or_404(card.list_id)
    board = get_or_create_user_board(current_user.id)
    if list_obj.board_id != board.id:
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.get_json()
    label = Label.query.get(data['label_id'])
    
    if label and label.board_id == board.id and label not in card.labels:
        card.labels.append(label)
        db.session.commit()
    
    return jsonify({'message': 'Label added'})

@app.route('/api/cards/<int:card_id>/labels/<int:label_id>', methods=['DELETE'])
@login_required
def remove_label_from_card(card_id, label_id):
    card = Card.query.get_or_404(card_id)
    
    # Проверяем, что карточка принадлежит пользователю
    list_obj = List.query.get_or_404(card.list_id)
    board = get_or_create_user_board(current_user.id)
    if list_obj.board_id != board.id:
        return jsonify({'error': 'Access denied'}), 403
    
    label = Label.query.get_or_404(label_id)
    
    if label in card.labels:
        card.labels.remove(label)
        db.session.commit()
    
    return jsonify({'message': 'Label removed'})

@app.route('/api/boards/<int:board_id>/labels', methods=['POST'])
@login_required
def create_label(board_id):
    # Проверяем, что доска принадлежит пользователю
    board = get_or_create_user_board(current_user.id)
    if board_id != board.id:
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.get_json()
    label = Label(
        name=data['name'],
        color=data['color'],
        board_id=board.id
    )
    db.session.add(label)
    db.session.commit()
    return jsonify({'id': label.id, 'name': label.name, 'color': label.color})

@app.route('/api/cards/<int:card_id>/archive', methods=['POST'])
@login_required
def archive_card(card_id):
    card = Card.query.get_or_404(card_id)
    
    # Проверяем, что карточка принадлежит пользователю
    list_obj = List.query.get_or_404(card.list_id)
    board = get_or_create_user_board(current_user.id)
    if list_obj.board_id != board.id:
        return jsonify({'error': 'Access denied'}), 403
    
    card.is_archived = True
    db.session.commit()
    
    return jsonify({'message': 'Card archived'})

@app.route('/api/lists/<int:list_id>/archive', methods=['POST'])
@login_required
def archive_list(list_id):
    list_obj = List.query.get_or_404(list_id)
    
    # Проверяем, что список принадлежит пользователю
    board = get_or_create_user_board(current_user.id)
    if list_obj.board_id != board.id:
        return jsonify({'error': 'Access denied'}), 403
    
    list_obj.is_archived = True
    # Также архивируем все карточки в списке
    Card.query.filter_by(list_id=list_id).update({'is_archived': True})
    db.session.commit()
    
    return jsonify({'message': 'List archived'})

@app.route('/api/cards/<int:card_id>', methods=['DELETE'])
@login_required
def delete_card(card_id):
    card = Card.query.get_or_404(card_id)
    
    # Проверяем, что карточка принадлежит пользователю
    list_obj = List.query.get_or_404(card.list_id)
    board = get_or_create_user_board(current_user.id)
    if list_obj.board_id != board.id:
        return jsonify({'error': 'Access denied'}), 403
    
    db.session.delete(card)
    db.session.commit()
    return jsonify({'message': 'Card deleted'})

@app.route('/api/lists/<int:list_id>', methods=['DELETE'])
@login_required
def delete_list(list_id):
    list_obj = List.query.get_or_404(list_id)
    
    # Проверяем, что список принадлежит пользователю
    board = get_or_create_user_board(current_user.id)
    if list_obj.board_id != board.id:
        return jsonify({'error': 'Access denied'}), 403
    
    # Удаляем все карточки в списке
    Card.query.filter_by(list_id=list_id).delete()
    db.session.delete(list_obj)
    db.session.commit()
    return jsonify({'message': 'List deleted'})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)