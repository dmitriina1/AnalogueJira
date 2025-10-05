from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from models import db, User, List, Card
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
    # Получаем все списки текущего пользователя с их карточками
    lists = List.query.filter_by(user_id=current_user.id).order_by(List.position).all()
    for list_obj in lists:
        list_obj.cards = Card.query.filter_by(list_id=list_obj.id).order_by(Card.position).all()
    
    return render_template('dashboard.html', lists=lists)

# API Routes
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
        position=max_position + 1
    )
    db.session.add(card)
    db.session.commit()
    return jsonify({'id': card.id, 'title': card.title})

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
    
    
@app.route('/api/cards/<int:card_id>/move', methods=['PUT'])
@login_required
def move_card(card_id):
    card = Card.query.get_or_404(card_id)
    # Проверяем, что карточка принадлежит пользователю
    list_obj = List.query.filter_by(id=card.list_id, user_id=current_user.id).first_or_404()
    
    data = request.get_json()
    new_list_id = data.get('list_id', card.list_id)
    new_position = data.get('position', 0)
    
    # Если карточка перемещается в другой список
    if new_list_id != card.list_id:
        # Проверяем, что новый список принадлежит пользователю
        new_list = List.query.filter_by(id=new_list_id, user_id=current_user.id).first_or_404()
        
        # Увеличиваем позиции карточек в старом списке, которые были после перемещаемой карточки
        Card.query.filter(
            Card.list_id == card.list_id,
            Card.position > card.position
        ).update({Card.position: Card.position - 1})
        
        # Увеличиваем позиции карточек в новом списке, которые будут после вставки
        Card.query.filter(
            Card.list_id == new_list_id,
            Card.position >= new_position
        ).update({Card.position: Card.position + 1})
        
        card.list_id = new_list_id
        card.position = new_position
    
    # Если карточка перемещается в том же списке
    else:
        old_position = card.position
        if new_position > old_position:
            # Перемещение вниз
            Card.query.filter(
                Card.list_id == card.list_id,
                Card.position > old_position,
                Card.position <= new_position
            ).update({Card.position: Card.position - 1})
        else:
            # Перемещение вверх
            Card.query.filter(
                Card.list_id == card.list_id,
                Card.position >= new_position,
                Card.position < old_position
            ).update({Card.position: Card.position + 1})
        
        card.position = new_position
    
    card.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({'message': 'Card moved successfully'})