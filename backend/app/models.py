from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table, func, LargeBinary
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime

Base = declarative_base()

# Tabella di giunzione Many-to-Many
candidate_skills = Table(
    'candidate_skills',
    Base.metadata,
    Column('candidate_id', Integer, ForeignKey('candidates.id', ondelete='CASCADE'), primary_key=True),
    Column('skill_id', Integer, ForeignKey('skills.id', ondelete='CASCADE'), primary_key=True)
)

class Skill(Base):
    __tablename__ = "skills"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)

class Candidate(Base):
    __tablename__ = "candidates"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    status = Column(String, default="new", index=True)
    rejection_reason = Column(String, nullable=True)
    cv_file_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    cv_filename = Column(String, nullable=True)
    cv_data = Column(LargeBinary, nullable=True)
    
    # Collega il candidato alle skill tramite la tabella di giunzione
    skills = relationship("Skill", secondary=candidate_skills, backref="candidates")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    created_at = Column(
        DateTime(timezone=True),          # consigliato: gestisce fusi orari
        nullable=False,
        server_default=func.now(),        # default a livello di DB
        # default=datetime.utcnow          # opzionale, mantiene anche il default ORM
    )