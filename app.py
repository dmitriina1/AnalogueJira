from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from models import db, User, List, Card, Checklist, ChecklistItem, Label, Comment, card_assignees, card_labels
from datetime import datetime
from sqlalchemy.orm import joinedload

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
        
        # Создаем начальные списки для нового пользователя
        lists = ['To Do', 'In Progress', 'Done']
        for i, name in enumerate(lists):
            new_list = List(name=name, position=i, user_id=user.id)
            db.session.add(new_list)
        
        db.session.commit()
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
    # Получаем все списки текущего пользователя
    lists = List.query.filter_by(user_id=current_user.id).order_by(List.position).all()
    
    # Для каждого списка загружаем карточки и связанные данные
    for list_obj in lists:
        # Загружаем карточки с чек-листами и комментариями
        list_obj.cards = Card.query.filter_by(list_id=list_obj.id)\
            .options(
                joinedload(Card.checklists).joinedload(Checklist.items),
                joinedload(Card.comments).joinedload(Comment.user)
            )\
            .order_by(Card.position).all()
        
        # Для каждой карточки загружаем назначенных пользователей и метки отдельными запросами
        for card in list_obj.cards:
            # Загружаем назначенных пользователей как список
            assignees_query = db.session.query(User)\
                .join(card_assignees, User.id == card_assignees.c.user_id)\
                .filter(card_assignees.c.card_id == card.id)\
                .all()
            card.assignees_list = assignees_query  # Сохраняем как обычный список
            
            # Загружаем метки как список
            labels_query = db.session.query(Label)\
                .join(card_labels, Label.id == card_labels.c.label_id)\
                .filter(card_labels.c.card_id == card.id)\
                .all()
            card.labels_list = labels_query  # Сохраняем как обычный список
            
            # Подсчитываем прогресс чек-листов
            card.total_checklist_items = 0
            card.completed_checklist_items = 0
            for checklist in card.checklists:
                card.total_checklist_items += len(checklist.items)
                card.completed_checklist_items += len([item for item in checklist.items if item.completed])
    
    return render_template('dashboard.html', lists=lists, now=datetime.utcnow())

# API Routes для пользователей
@app.route('/api/users')
@login_required
def get_users():
    # Возвращаем всех пользователей
    users = User.query.all()
    return jsonify([{'id': user.id, 'username': user.username} for user in users])

# API Routes для меток
@app.route('/api/labels')
@login_required
def get_labels():
    labels = Label.query.filter_by(user_id=current_user.id).all()
    return jsonify([{'id': label.id, 'name': label.name, 'color': label.color} for label in labels])

@app.route('/api/labels', methods=['POST'])
@login_required
def create_label():
    data = request.get_json()
    label = Label(
        name=data['name'],
        color=data['color'],
        user_id=current_user.id
    )
    db.session.add(label)
    db.session.commit()
    return jsonify({'id': label.id, 'name': label.name, 'color': label.color})

@app.route('/api/cards/<int:card_id>/labels', methods=['POST'])
@login_required
def add_label_to_card(card_id):
    card = Card.query.get_or_404(card_id)
    list_obj = List.query.filter_by(id=card.list_id, user_id=current_user.id).first_or_404()
    
    data = request.get_json()
    label_id = data.get('label_id')
    
    label = Label.query.filter_by(id=label_id, user_id=current_user.id).first()
    if label and label not in card.labels:
        # Добавляем связь через ассоциативную таблицу
        stmt = card_labels.insert().values(card_id=card_id, label_id=label_id)
        db.session.execute(stmt)
        db.session.commit()
    
    return jsonify({'message': 'Label added'})

@app.route('/api/cards/<int:card_id>/labels/<int:label_id>', methods=['DELETE'])
@login_required
def remove_label_from_card(card_id, label_id):
    card = Card.query.get_or_404(card_id)
    list_obj = List.query.filter_by(id=card.list_id, user_id=current_user.id).first_or_404()
    
    label = Label.query.filter_by(id=label_id, user_id=current_user.id).first()
    if label:
        # Удаляем связь через ассоциативную таблицу
        stmt = card_labels.delete().where(
            (card_labels.c.card_id == card_id) & 
            (card_labels.c.label_id == label_id)
        )
        db.session.execute(stmt)
        db.session.commit()
    
    return jsonify({'message': 'Label removed'})

# API Routes для назначений
@app.route('/api/cards/<int:card_id>/assignees', methods=['POST'])
@login_required
def assign_user_to_card(card_id):
    card = Card.query.get_or_404(card_id)
    list_obj = List.query.filter_by(id=card.list_id, user_id=current_user.id).first_or_404()
    
    data = request.get_json()
    user_id = data.get('user_id')
    
    user = User.query.get(user_id)
    if user and user not in card.assignees:
        # Добавляем связь через ассоциативную таблицу
        stmt = card_assignees.insert().values(card_id=card_id, user_id=user_id)
        db.session.execute(stmt)
        db.session.commit()
    
    return jsonify({'message': 'User assigned'})

@app.route('/api/cards/<int:card_id>/assignees/<int:user_id>', methods=['DELETE'])
@login_required
def unassign_user_from_card(card_id, user_id):
    card = Card.query.get_or_404(card_id)
    list_obj = List.query.filter_by(id=card.list_id, user_id=current_user.id).first_or_404()
    
    user = User.query.get(user_id)
    if user:
        # Удаляем связь через ассоциативную таблицу
        stmt = card_assignees.delete().where(
            (card_assignees.c.card_id == card_id) & 
            (card_assignees.c.user_id == user_id)
        )
        db.session.execute(stmt)
        db.session.commit()
    
    return jsonify({'message': 'User unassigned'})

# API Routes для чек-листов
@app.route('/api/cards/<int:card_id>/checklists', methods=['POST'])
@login_required
def create_checklist(card_id):
    card = Card.query.get_or_404(card_id)
    list_obj = List.query.filter_by(id=card.list_id, user_id=current_user.id).first_or_404()
    
    data = request.get_json()
    checklist = Checklist(
        title=data['title'],
        card_id=card_id,
        position=data.get('position', 0)
    )
    db.session.add(checklist)
    db.session.commit()
    return jsonify({'id': checklist.id, 'title': checklist.title})

@app.route('/api/checklists/<int:checklist_id>/items', methods=['POST'])
@login_required
def create_checklist_item(checklist_id):
    checklist = Checklist.query.get_or_404(checklist_id)
    card = Card.query.get(checklist.card_id)
    list_obj = List.query.filter_by(id=card.list_id, user_id=current_user.id).first_or_404()
    
    data = request.get_json()
    item = ChecklistItem(
        text=data['text'],
        checklist_id=checklist_id,
        position=data.get('position', 0)
    )
    db.session.add(item)
    db.session.commit()
    return jsonify({'id': item.id, 'text': item.text, 'completed': item.completed})

@app.route('/api/checklist-items/<int:item_id>', methods=['PUT'])
@login_required
def update_checklist_item(item_id):
    item = ChecklistItem.query.get_or_404(item_id)
    checklist = Checklist.query.get(item.checklist_id)
    card = Card.query.get(checklist.card_id)
    list_obj = List.query.filter_by(id=card.list_id, user_id=current_user.id).first_or_404()
    
    data = request.get_json()
    if 'completed' in data:
        item.completed = data['completed']
    if 'text' in data:
        item.text = data['text']
    
    db.session.commit()
    return jsonify({'message': 'Checklist item updated'})

@app.route('/api/checklists/<int:checklist_id>', methods=['DELETE'])
@login_required
def delete_checklist(checklist_id):
    checklist = Checklist.query.get_or_404(checklist_id)
    card = Card.query.get(checklist.card_id)
    list_obj = List.query.filter_by(id=card.list_id, user_id=current_user.id).first_or_404()
    
    db.session.delete(checklist)
    db.session.commit()
    return jsonify({'message': 'Checklist deleted'})

# API Routes для комментариев
@app.route('/api/cards/<int:card_id>/comments', methods=['POST'])
@login_required
def create_comment(card_id):
    card = Card.query.get_or_404(card_id)
    list_obj = List.query.filter_by(id=card.list_id, user_id=current_user.id).first_or_404()
    
    data = request.get_json()
    comment = Comment(
        text=data['text'],
        card_id=card_id,
        user_id=current_user.id
    )
    db.session.add(comment)
    db.session.commit()
    
    return jsonify({
        'id': comment.id,
        'text': comment.text,
        'created_at': comment.created_at.isoformat(),
        'user': {'username': current_user.username}
    })

# API Routes для карточек
@app.route('/api/cards/<int:card_id>')
@login_required
def get_card(card_id):
    card = Card.query.options(
        joinedload(Card.checklists).joinedload(Checklist.items),
        joinedload(Card.comments).joinedload(Comment.user)
    ).get_or_404(card_id)
    
    # Проверяем, что карточка принадлежит пользователю
    list_obj = List.query.filter_by(id=card.list_id, user_id=current_user.id).first_or_404()
    
    # Загружаем назначенных пользователей отдельным запросом
    assignees = db.session.query(User)\
        .join(card_assignees, User.id == card_assignees.c.user_id)\
        .filter(card_assignees.c.card_id == card.id)\
        .all()
    
    # Загружаем метки отдельным запросом
    labels = db.session.query(Label)\
        .join(card_labels, Label.id == card_labels.c.label_id)\
        .filter(card_labels.c.card_id == card.id)\
        .all()
    
    # Подсчитываем прогресс чек-листов
    checklists_data = []
    for checklist in card.checklists:
        total_items = len(checklist.items)
        completed_items = len([item for item in checklist.items if item.completed])
        checklists_data.append({
            'id': checklist.id,
            'title': checklist.title,
            'items': [{
                'id': item.id,
                'text': item.text,
                'completed': item.completed
            } for item in checklist.items],
            'progress': {
                'total': total_items,
                'completed': completed_items
            }
        })
    
    card_data = {
        'id': card.id,
        'title': card.title,
        'description': card.description,
        'list_id': card.list_id,
        'due_date': card.due_date.isoformat() if card.due_date else None,
        'assignees': [{'id': user.id, 'username': user.username} for user in assignees],
        'labels': [{'id': label.id, 'name': label.name, 'color': label.color} for label in labels],
        'checklists': checklists_data,
        'comments': [{
            'id': comment.id,
            'text': comment.text,
            'created_at': comment.created_at.isoformat(),
            'user': {'username': comment.user.username}
        } for comment in card.comments]
    }
    
    return jsonify(card_data)

@app.route('/api/cards/<int:card_id>', methods=['PUT'])
@login_required
def update_card(card_id):
    card = Card.query.get_or_404(card_id)
    # Проверяем, что карточка принадлежит пользователю
    list_obj = List.query.filter_by(id=card.list_id, user_id=current_user.id).first_or_404()
    
    data = request.get_json()
    
    if 'title' in data:
        card.title = data['title']
    if 'description' in data:
        card.description = data['description']
    if 'list_id' in data:
        card.list_id = data['list_id']
    if 'position' in data:
        card.position = data['position']
    if 'due_date' in data:
        card.due_date = datetime.fromisoformat(data['due_date']) if data['due_date'] else None
    
    card.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({'message': 'Card updated'})

@app.route('/api/cards/<int:card_id>', methods=['DELETE'])
@login_required
def delete_card(card_id):
    card = Card.query.get_or_404(card_id)
    # Проверяем, что карточка принадлежит пользователю
    list_obj = List.query.filter_by(id=card.list_id, user_id=current_user.id).first_or_404()
    
    db.session.delete(card)
    db.session.commit()
    return jsonify({'message': 'Card deleted'})

# API Routes для списков
@app.route('/api/lists', methods=['POST'])
@login_required
def create_list():
    data = request.get_json()
    # Получаем максимальную позицию для нового списка
    max_position = db.session.query(db.func.max(List.position)).filter_by(user_id=current_user.id).scalar() or 0
    list_obj = List(
        name=data['name'],
        position=max_position + 1,
        user_id=current_user.id
    )
    db.session.add(list_obj)
    db.session.commit()
    return jsonify({'id': list_obj.id, 'name': list_obj.name})

@app.route('/api/lists/<int:list_id>/cards', methods=['POST'])
@login_required
def create_card(list_id):
    data = request.get_json()
    # Проверяем, что список принадлежит текущему пользователю
    list_obj = List.query.filter_by(id=list_id, user_id=current_user.id).first_or_404()
    
    # Получаем максимальную позицию для новой карточки
    max_position = db.session.query(db.func.max(Card.position)).filter_by(list_id=list_id).scalar() or 0
    card = Card(
        title=data['title'],
        description=data.get('description', ''),
        list_id=list_id,
        position=max_position + 1,
        due_date=datetime.fromisoformat(data['due_date']) if data.get('due_date') else None
    )
    db.session.add(card)
    db.session.commit()
    return jsonify({'id': card.id, 'title': card.title})

@app.route('/api/lists/<int:list_id>', methods=['DELETE'])
@login_required
def delete_list(list_id):
    list_obj = List.query.filter_by(id=list_id, user_id=current_user.id).first_or_404()
    
    # Удаляем все карточки в списке
    Card.query.filter_by(list_id=list_id).delete()
    db.session.delete(list_obj)
    db.session.commit()
    return jsonify({'message': 'List deleted'})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)