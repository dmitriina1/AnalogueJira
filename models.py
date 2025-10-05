from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

# Association table for card labels
card_labels = db.Table('card_labels',
    db.Column('card_id', db.Integer, db.ForeignKey('card.id'), primary_key=True),
    db.Column('label_id', db.Integer, db.ForeignKey('label.id'), primary_key=True)
)

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    boards = db.relationship('Board', backref='user', lazy=True)
    assigned_cards = db.relationship('Card', foreign_keys='Card.assignee_id', backref='assignee', lazy=True)
    reported_cards = db.relationship('Card', foreign_keys='Card.reporter_id', backref='reporter', lazy=True)
    comments = db.relationship('Comment', backref='author', lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Board(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    background_color = db.Column(db.String(7), default='#0079bf')
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # Добавлено user_id
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    lists = db.relationship('List', backref='board', lazy=True, cascade='all, delete-orphan')
    labels = db.relationship('Label', backref='board', lazy=True, cascade='all, delete-orphan')

class Label(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    color = db.Column(db.String(7), nullable=False)
    board_id = db.Column(db.Integer, db.ForeignKey('board.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class List(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    position = db.Column(db.Integer, default=0)
    board_id = db.Column(db.Integer, db.ForeignKey('board.id'), nullable=False)
    is_archived = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    cards = db.relationship('Card', backref='list', lazy=True, cascade='all, delete-orphan')

class Card(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    position = db.Column(db.Integer, default=0)
    due_date = db.Column(db.DateTime)
    time_estimate = db.Column(db.Integer)
    time_spent = db.Column(db.Integer, default=0)
    is_archived = db.Column(db.Boolean, default=False)
    list_id = db.Column(db.Integer, db.ForeignKey('list.id'), nullable=False)
    assignee_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    reporter_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    labels = db.relationship('Label', secondary=card_labels, lazy='subquery',
                           backref=db.backref('cards', lazy=True))
    checklists = db.relationship('Checklist', backref='card', lazy=True, cascade='all, delete-orphan')
    comments = db.relationship('Comment', backref='card', lazy=True, cascade='all, delete-orphan')

class Checklist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    position = db.Column(db.Integer, default=0)
    card_id = db.Column(db.Integer, db.ForeignKey('card.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    items = db.relationship('ChecklistItem', backref='checklist', lazy=True, cascade='all, delete-orphan')

class ChecklistItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(200), nullable=False)
    is_checked = db.Column(db.Boolean, default=False)
    position = db.Column(db.Integer, default=0)
    checklist_id = db.Column(db.Integer, db.ForeignKey('checklist.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    card_id = db.Column(db.Integer, db.ForeignKey('card.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)