from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import enum

db = SQLAlchemy()

class UserRole(enum.Enum):
    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    avatar_url = db.Column(db.String(200))
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'avatar_url': self.avatar_url,
            'created_at': self.created_at.isoformat()
        }

# Модель проекта
class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    creator_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Связь one-to-one с доской
    board = db.relationship('Board', backref='project_ref', uselist=False, cascade='all, delete-orphan')
    invitations = db.relationship('Invitation', backref='project', lazy=True, cascade='all, delete-orphan')
    members = db.relationship('ProjectMember', backref='project', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'creator_id': self.creator_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'member_count': len(self.members),
            # ИСПРАВЛЕНО: используем self.board вместо self.boards
            'boards': [self.board.to_dict()] if self.board else []
        }

# Модель участников проекта
class ProjectMember(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    role = db.Column(db.Enum(UserRole), default=UserRole.MEMBER)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Отношения
    user = db.relationship('User', backref='project_memberships')
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'user': self.user.to_dict(),
            'role': self.role.value,
            'joined_at': self.joined_at.isoformat()
        }

# Модель приглашений
class Invitation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    invited_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # Изменено на nullable=True
    invited_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    role = db.Column(db.Enum(UserRole), default=UserRole.MEMBER)
    token = db.Column(db.String(100), unique=True, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, accepted, rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)
    
    # Отношения
    invited_by = db.relationship('User', foreign_keys=[invited_by_id], backref='sent_invitations')
    # Обновите отношение для invited_user_id
    invited_user = db.relationship('User', foreign_keys=[invited_user_id], backref='received_invitations')
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'project_name': self.project.name,
            'invited_user': self.invited_user.to_dict() if self.invited_user else None,
            'invited_by': self.invited_by.to_dict(),
            'role': self.role.value,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'requires_registration': self.role != UserRole.VIEWER  # Добавляем это поле
        }

# Модель доски
class Board(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Отношения
    lists = db.relationship('BoardList', backref='board', lazy=True, cascade='all, delete-orphan', order_by='BoardList.position')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'project_id': self.project_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'lists': [lst.to_dict() for lst in self.lists] if self.lists else []
        }

# Модель списка на доске
class BoardList(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    position = db.Column(db.Integer, default=0)
    board_id = db.Column(db.Integer, db.ForeignKey('board.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Отношения
    cards = db.relationship('Card', backref='list', lazy=True, cascade='all, delete-orphan', order_by='Card.position')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'position': self.position,
            'board_id': self.board_id,
            'created_at': self.created_at.isoformat(),
            'cards': [card.to_dict() for card in self.cards] if self.cards else []
        }

# Модель карточки (задачи)
class Card(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    position = db.Column(db.Integer, default=0)
    due_date = db.Column(db.DateTime)
    list_id = db.Column(db.Integer, db.ForeignKey('board_list.id'), nullable=False)
    created_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Отношения
    created_by = db.relationship('User', foreign_keys=[created_by_id])
    assignees = db.relationship('CardAssignee', backref='card', lazy=True, cascade='all, delete-orphan')
    labels = db.relationship('CardLabel', backref='card', lazy=True, cascade='all, delete-orphan')
    checklists = db.relationship('Checklist', backref='card', lazy=True, cascade='all, delete-orphan')
    comments = db.relationship('Comment', backref='card', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'position': self.position,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'list_id': self.list_id,
            'created_by': self.created_by.to_dict() if self.created_by else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'assignees': [assignee.user.to_dict() for assignee in self.assignees] if self.assignees else [],
            'labels': [card_label.label.to_dict() for card_label in self.labels] if self.labels else [],
            'checklists': [checklist.to_dict() for checklist in self.checklists] if self.checklists else [],
            'comments': [comment.to_dict() for comment in self.comments] if self.comments else []
        }

# Модель назначенных пользователей на карточку
class CardAssignee(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    card_id = db.Column(db.Integer, db.ForeignKey('card.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User')

# Модель меток
class Label(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    color = db.Column(db.String(7), nullable=False)  # HEX color
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Отношения
    project = db.relationship('Project', backref='labels')
    card_labels = db.relationship('CardLabel', backref='label', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'color': self.color,
            'project_id': self.project_id,
            'created_at': self.created_at.isoformat()
        }

# Связующая таблица карточка-метка
class CardLabel(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    card_id = db.Column(db.Integer, db.ForeignKey('card.id'), nullable=False)
    label_id = db.Column(db.Integer, db.ForeignKey('label.id'), nullable=False)

# Модель чеклиста
class Checklist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    card_id = db.Column(db.Integer, db.ForeignKey('card.id'), nullable=False)
    position = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Отношения
    items = db.relationship('ChecklistItem', backref='checklist', lazy=True, cascade='all, delete-orphan', order_by='ChecklistItem.position')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'card_id': self.card_id,
            'position': self.position,
            'created_at': self.created_at.isoformat(),
            'items': [item.to_dict() for item in self.items],
            'completed_count': len([item for item in self.items if item.completed]),
            'total_count': len(self.items)
        }

# Модель элемента чеклиста
class ChecklistItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(200), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    position = db.Column(db.Integer, default=0)
    checklist_id = db.Column(db.Integer, db.ForeignKey('checklist.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'text': self.text,
            'completed': self.completed,
            'position': self.position,
            'checklist_id': self.checklist_id,
            'created_at': self.created_at.isoformat()
        }

class Mention(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    comment_id = db.Column(db.Integer, db.ForeignKey('comment.id'), nullable=False)
    mentioned_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Отношения - используем back_populates вместо backref
    mentioned_user = db.relationship('User', foreign_keys=[mentioned_user_id])
    comment = db.relationship('Comment', back_populates='mentions')
    
# Модель комментария
class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text, nullable=False)
    card_id = db.Column(db.Integer, db.ForeignKey('card.id'), nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Отношения
    author = db.relationship('User', foreign_keys=[author_id])
    mentions = db.relationship('Mention', back_populates='comment', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'text': self.text,
            'card_id': self.card_id,
            'author': self.author.to_dict() if self.author else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'mentions': [mention.mentioned_user.to_dict() for mention in self.mentions] if self.mentions else []
        }
        
class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # card_assignment, deadline, etc.
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text)
    data = db.Column(db.JSON)  # Дополнительные данные в JSON формате
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    read_at = db.Column(db.DateTime, nullable=True)
    
    # Отношения
    user = db.relationship('User', backref='notifications')
    
    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'data': self.data,
            'created_at': self.created_at.isoformat(),
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'is_read': self.read_at is not None
        }
        
