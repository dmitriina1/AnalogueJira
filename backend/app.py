from flask import Flask, request, jsonify
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_cors import CORS
from models import db, User, Project, ProjectMember, Invitation, Board, BoardList, Card, Label, CardLabel, CardAssignee, Checklist, ChecklistItem, Comment, UserRole
from config import Config
import uuid
from datetime import datetime, timedelta
import json
import os
from sqlalchemy import text 
from flask_cors import CORS

from models import (
    db, User, Project, ProjectMember, Invitation, 
    Board, BoardList, Card, Label, CardLabel, 
    CardAssignee, Checklist, ChecklistItem, Comment, UserRole
)

app = Flask(__name__)
app.config.from_object(Config)
CORS(app, 
     supports_credentials=True,
     origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://172.17.64.1:3000"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"]
)

# Инициализация базы данных
db.init_app(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Создаем таблицы при запуске
with app.app_context():
    try:
        db.create_all()
        print("✅ Database tables created successfully!")
        
        # Выводим список созданных таблиц
        inspector = db.inspect(db.engine)
        tables = inspector.get_table_names()
        print(f"📋 Created tables: {tables}")
        
        # Проверяем, есть ли пользователи
        if User.query.count() == 0:
            print("📝 No users found, database is empty")
        else:
            print(f"👥 Found {User.query.count()} users in database")
            
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        import traceback
        traceback.print_exc()

# Вспомогательные функции
def has_project_access(project_id, required_role=None):
    """Проверка доступа пользователя к проекту"""
    membership = ProjectMember.query.filter_by(
        project_id=project_id, 
        user_id=current_user.id
    ).first()
    
    if not membership:
        return False
    
    if required_role:
        role_hierarchy = {UserRole.VIEWER: 1, UserRole.MEMBER: 2, UserRole.ADMIN: 3}
        user_role_level = role_hierarchy[membership.role]
        required_role_level = role_hierarchy[required_role]
        return user_role_level >= required_role_level
    
    return True

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify({'status': 'preflight'})
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        return response
    
# API Routes

# Аутентификация
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        print(f"📝 Registration attempt for: {data['username']}")
        
        # Проверяем существующего пользователя
        existing_user = User.query.filter_by(username=data['username']).first()
        if existing_user:
            print("❌ Username already exists")
            return jsonify({'error': 'Username already exists'}), 400
        
        existing_email = User.query.filter_by(email=data['email']).first()
        if existing_email:
            print("❌ Email already exists")
            return jsonify({'error': 'Email already exists'}), 400
        
        # Создаем нового пользователя
        user = User(
            username=data['username'],
            email=data['email']
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        print(f"✅ User {user.username} created successfully")
        login_user(user)
        return jsonify(user.to_dict())
        
    except Exception as e:
        print(f"❌ Registration error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        print(f"🔐 Login attempt for: {data['username']}")
        
        user = User.query.filter_by(username=data['username']).first()
        
        if user and user.check_password(data['password']):
            login_user(user)
            print(f"✅ User {user.username} logged in successfully")
            return jsonify(user.to_dict())
        
        print("❌ Invalid credentials")
        return jsonify({'error': 'Invalid credentials'}), 401
        
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logged out successfully'})

@app.route('/api/user')
@login_required
def get_current_user():
    return jsonify(current_user.to_dict())

# Проверка здоровья API
@app.route('/api/health')
def health_check():
    try:
        # Проверяем подключение к базе данных с text()
        db.session.execute(text('SELECT 1'))
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': str(e)
        }), 500

# Projects endpoints
@app.route('/api/projects', methods=['GET'])
@login_required
def get_projects():
    try:
        # Получаем проекты, где пользователь является участником
        memberships = ProjectMember.query.filter_by(user_id=current_user.id).all()
        projects = [membership.project.to_dict() for membership in memberships]
        
        return jsonify(projects)
    except Exception as e:
        print(f"❌ Error getting projects: {str(e)}")
        return jsonify({'error': 'Failed to get projects'}), 500

@app.route('/api/projects', methods=['POST'])
@login_required
def create_project():
    try:
        data = request.get_json()
        print(f"📝 Creating project: {data['name']}")
        
        # Создаем проект
        project = Project(
            name=data['name'],
            description=data.get('description', ''),
            creator_id=current_user.id
        )
        
        db.session.add(project)
        db.session.flush()  # Получаем ID проекта до коммита
        
        print(f"📊 Project created with ID: {project.id}")
        
        # ИСПРАВЛЕНО: используем project_id вместо project
        board = Board(
            name=f"{data['name']} Board",
            description=data.get('description', ''),
            project_id=project.id  # ИСПРАВЛЕНО: project_id вместо project
        )
        
        db.session.add(board)
        db.session.flush()  # Получаем ID доски до коммита
        
        print(f"📋 Board created with ID: {board.id}")
        
        # Создаем стандартные списки для доски
        default_lists = ['To Do', 'In Progress', 'Done']
        for i, list_name in enumerate(default_lists):
            board_list = BoardList(
                name=list_name,
                position=i,
                board_id=board.id  # Явно устанавливаем board_id
            )
            db.session.add(board_list)
            print(f"✅ Created list: {list_name} for board {board.id}")
        
        # Добавляем создателя как администратора проекта
        membership = ProjectMember(
            project_id=project.id,
            user_id=current_user.id,
            role=UserRole.ADMIN
        )
        db.session.add(membership)
        
        db.session.commit()
        
        print(f"✅ Project {project.name} created successfully with single board")
        return jsonify(project.to_dict())
        
    except Exception as e:
        print(f"❌ Error creating project: {str(e)}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'error': 'Failed to create project', 'details': str(e)}), 500

# Invitations endpoints
@app.route('/api/invitations', methods=['GET'])
@login_required
def get_invitations():
    try:
        invitations = Invitation.query.filter_by(
            invited_user_id=current_user.id,
            status='pending'
        ).all()
        
        return jsonify([invitation.to_dict() for invitation in invitations])
    except Exception as e:
        print(f"❌ Error getting invitations: {str(e)}")
        return jsonify({'error': 'Failed to get invitations'}), 500

# Boards endpoints
@app.route('/api/projects/<int:project_id>/boards', methods=['POST'])
@login_required
def create_board(project_id):
    try:
        if not has_project_access(project_id, UserRole.MEMBER):
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        data = request.get_json()
        
        board = Board(
            name=data['name'],
            description=data.get('description', ''),
            project_id=project_id
        )
        
        db.session.add(board)
        
        # Создаем стандартные списки
        default_lists = ['To Do', 'In Progress', 'Done']
        for i, list_name in enumerate(default_lists):
            board_list = BoardList(
                name=list_name,
                position=i,
                board=board
            )
            db.session.add(board_list)
        
        db.session.commit()
        
        return jsonify(board.to_dict())
        
    except Exception as e:
        print(f"❌ Error creating board: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to create board'}), 500

# Projects endpoints
@app.route('/api/projects/<int:project_id>')
@login_required
def get_project(project_id):
    try:
        if not has_project_access(project_id):
            return jsonify({'error': 'Access denied'}), 403
        
        project = Project.query.get_or_404(project_id)
        return jsonify(project.to_dict())
    except Exception as e:
        print(f"❌ Error getting project: {str(e)}")
        return jsonify({'error': 'Failed to get project'}), 500

@app.route('/api/projects/<int:project_id>/members')
@login_required
def get_project_members(project_id):
    try:
        if not has_project_access(project_id):
            return jsonify({'error': 'Access denied'}), 403
        
        members = ProjectMember.query.filter_by(project_id=project_id).all()
        return jsonify([member.to_dict() for member in members])
    except Exception as e:
        print(f"❌ Error getting project members: {str(e)}")
        return jsonify({'error': 'Failed to get project members'}), 500

# Boards endpoints
@app.route('/api/boards/<int:board_id>')
@login_required
def get_board(board_id):
    try:
        board = Board.query.get_or_404(board_id)
        
        # Проверяем доступ к проекту доски
        if not has_project_access(board.project_id):
            return jsonify({'error': 'Access denied'}), 403
        
        return jsonify(board.to_dict())
    except Exception as e:
        print(f"❌ Error getting board: {str(e)}")
        return jsonify({'error': 'Failed to get board'}), 500

@app.route('/api/projects/<int:project_id>/boards')
@login_required
def get_project_boards(project_id):
    try:
        if not has_project_access(project_id):
            return jsonify({'error': 'Access denied'}), 403
        
        project = Project.query.get_or_404(project_id)
        boards = Board.query.filter_by(project_id=project_id).all()
        
        return jsonify([board.to_dict() for board in boards])
    except Exception as e:
        print(f"❌ Error getting project boards: {str(e)}")
        return jsonify({'error': 'Failed to get project boards'}), 500

@app.route('/api/users')
@login_required
def get_users():
    try:
        users = User.query.all()
        return jsonify([user.to_dict() for user in users])
    except Exception as e:
        print(f"❌ Error getting users: {str(e)}")
        return jsonify({'error': 'Failed to get users'}), 500
    
# Lists endpoints
@app.route('/api/lists/<int:list_id>/cards', methods=['POST'])
@login_required
def create_card(list_id):
    try:
        board_list = BoardList.query.get_or_404(list_id)
        
        if not has_project_access(board_list.board.project_id, UserRole.MEMBER):
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        data = request.get_json()
        
        # Определяем следующую позицию
        max_position = db.session.query(db.func.max(Card.position)).filter_by(list_id=list_id).scalar() or 0
        
        card = Card(
            title=data['title'],
            description=data.get('description', ''),
            position=max_position + 1,
            list_id=list_id,
            created_by_id=current_user.id
        )
        
        if data.get('due_date'):
            card.due_date = datetime.fromisoformat(data['due_date'])
        
        db.session.add(card)
        db.session.commit()
        
        return jsonify(card.to_dict())
        
    except Exception as e:
        print(f"❌ Error creating card: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to create card'}), 500

# Cards endpoints
@app.route('/api/cards/<int:card_id>', methods=['PUT'])
@login_required
def update_card(card_id):
    try:
        card = Card.query.get_or_404(card_id)
        
        # Проверяем доступ к проекту карточки
        if not has_project_access(card.list.board.project_id, UserRole.MEMBER):
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        data = request.get_json()
        
        # Обновляем поля карточки
        if 'title' in data:
            card.title = data['title']
        if 'description' in data:
            card.description = data['description']
        if 'due_date' in data and data['due_date']:
            card.due_date = datetime.fromisoformat(data['due_date'])
        if 'list_id' in data:
            card.list_id = data['list_id']
        if 'position' in data:
            card.position = data['position']
        
        card.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify(card.to_dict())
        
    except Exception as e:
        print(f"❌ Error updating card: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to update card'}), 500
    
@app.route('/api/cards/<int:card_id>')
@login_required
def get_card(card_id):
    try:
        card = Card.query.get_or_404(card_id)
        
        # Проверяем доступ к проекту карточки
        if not has_project_access(card.list.board.project_id):
            return jsonify({'error': 'Access denied'}), 403
        
        return jsonify(card.to_dict())
    except Exception as e:
        print(f"❌ Error getting card: {str(e)}")
        return jsonify({'error': 'Failed to get card'}), 500

# Comments endpoints
@app.route('/api/cards/<int:card_id>/comments', methods=['POST'])
@login_required
def add_comment(card_id):
    try:
        card = Card.query.get_or_404(card_id)
        
        if not has_project_access(card.list.board.project_id, UserRole.MEMBER):
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        data = request.get_json()
        
        comment = Comment(
            text=data['text'],
            card_id=card_id,
            author_id=current_user.id
        )
        
        db.session.add(comment)
        db.session.commit()
        
        return jsonify(comment.to_dict())
        
    except Exception as e:
        print(f"❌ Error adding comment: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to add comment'}), 500

# Assignees endpoints
@app.route('/api/cards/<int:card_id>/assignees', methods=['POST'])
@login_required
def assign_user_to_card(card_id):
    try:
        card = Card.query.get_or_404(card_id)
        
        if not has_project_access(card.list.board.project_id, UserRole.MEMBER):
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        data = request.get_json()
        user = User.query.get_or_404(data['user_id'])
        
        # Проверяем, что пользователь является участником проекта
        if not ProjectMember.query.filter_by(project_id=card.list.board.project_id, user_id=user.id).first():
            return jsonify({'error': 'User is not a project member'}), 400
        
        # Проверяем, не назначен ли уже пользователь
        existing_assignee = CardAssignee.query.filter_by(card_id=card_id, user_id=user.id).first()
        if existing_assignee:
            return jsonify({'error': 'User already assigned to this card'}), 400
        
        assignee = CardAssignee(card_id=card_id, user_id=user.id)
        db.session.add(assignee)
        db.session.commit()
        
        return jsonify({'message': 'User assigned successfully'})
        
    except Exception as e:
        print(f"❌ Error assigning user: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to assign user'}), 500

# Debug endpoint to list all available routes
@app.route('/api/debug/routes')
def debug_routes():
    routes = []
    for rule in app.url_map.iter_rules():
        if rule.endpoint != 'static':
            routes.append({
                'endpoint': rule.endpoint,
                'methods': list(rule.methods),
                'path': str(rule)
            })
    return jsonify(sorted(routes, key=lambda x: x['path']))

# Запуск приложения
if __name__ == '__main__':
    print("🚀 Starting Jira Analog Backend...")
    print(f"📊 Database: {app.config['SQLALCHEMY_DATABASE_URI']}")
    app.run(debug=True, host='0.0.0.0', port=5000)