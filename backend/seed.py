# seed.py
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.document import Document

def seed_data():
    db: Session = SessionLocal()
    
    # Kiểm tra nếu đã có dữ liệu thì không seed lại, tránh trùng lặp
    if db.query(User).first() is not None:
        print("Database đã có dữ liệu mẫu từ trước. Hủy seeding!")
        db.close()
        return

    print("Đang khởi tạo dữ liệu mẫu...")

    # 1. Tạo danh sách 5 Users mẫu nhanh
    users = [
        User(username="admin", email="admin@rag.io", hashed_password="hashed_password_123", is_active=True),
        User(username="developer_bk", email="dev_bk@gmail.com", hashed_password="hashed_password_456", is_active=True),
        User(username="test_user", email="test@gmail.com", hashed_password="hashed_password_789", is_active=True)
    ]
    db.add_all(users)
    db.commit() # Commit để sinh ra ID cho các User trước

    # 2. Tạo danh sách Documents mẫu liên kết với các User trên
    documents = [
        Document(
            title="Hướng dẫn học Python cho người mới",
            content="Python là ngôn ngữ lập trình mạnh mẽ, dễ học và phổ biến bậc nhất.",
            file_path="/storage/docs/python_basic.txt",
            file_size=1024,
            user_id=users[1].id, # Gắn trực tiếp với ID của developer_bk
            embedding=[0.85, 0.15, 0.05]
        ),
        Document(
            title="Kinh nghiệm quản lý vốn khởi nghiệp",
            content="Đầu tư ban đầu cần tập trung tối ưu hóa sản phẩm thay vì đốt tiền marketing.",
            file_path="/storage/docs/startup_fund.txt",
            file_size=4050,
            user_id=users[0].id, # Gắn với admin
            embedding=[0.10, 0.90, 0.12]
        ),
        Document(
            title="Phương pháp thiền giảm stress công việc",
            content="Dành ra 10 phút tập trung vào hơi thở vào buổi sáng sẽ cải thiện sự tập trung.",
            file_path="/storage/docs/meditation.txt",
            file_size=1500,
            user_id=users[2].id, # Gắn với test_user
            embedding=[0.05, 0.05, 0.95]
        )
    ]
    
    db.add_all(documents)
    db.commit()
    db.close()
    print("Seeding hoàn tất thành công!")

if __name__ == "__main__":
    seed_data()