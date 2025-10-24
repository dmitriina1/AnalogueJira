from app import app, db
from models import User
import os
from sqlalchemy import text

def reset_database():
    with app.app_context():
        # Удаляем файл базы данных если существует
        db_path = 'jira.db'
        if os.path.exists(db_path):
            os.remove(db_path)
            print(f"🗑️  Removed existing database: {db_path}")
        
        # Создаем все таблицы
        db.create_all()
        print("✅ Database tables created successfully!")
        
        # Проверяем созданные таблицы
        inspector = db.inspect(db.engine)
        tables = inspector.get_table_names()
        print(f"📋 Tables in database: {tables}")
        
        # Проверяем подключение
        try:
            db.session.execute(text('SELECT 1'))
            print("✅ Database connection test passed")
        except Exception as e:
            print(f"❌ Database connection test failed: {e}")
        
        # Проверяем User таблицу
        user_count = User.query.count()
        print(f"📊 Users count: {user_count}")

if __name__ == '__main__':
    reset_database()