class User < ActiveRecord::Base
  has_and_belongs_to_many(:users,
    :join_table => "user_connections",
    :foreign_key => "user_a_id",
    :association_foreign_key => "user_b_id")
  has_and_belongs_to_many :conversations, :dependent => :delete_all
  has_many :notifications

  attr_accessor :password
  before_save :encrypt_password
  before_create :generate_access_token

  validates_confirmation_of :password
  validates_presence_of :password, :on => :create
  validates_presence_of :username
  validates_uniqueness_of :username

  def self.authenticate(username, password)
    user = find_by_username(username)
    if user && user.password_hash == BCrypt::Engine.hash_secret(password, user.password_salt)
      user
    else
      nil
    end
  end

  def encrypt_password
    if password.present?
      self.password_salt = BCrypt::Engine.generate_salt
      self.password_hash = BCrypt::Engine.hash_secret(password, password_salt)
    end
  end

  private
  def generate_access_token
    begin
      self.access_token = SecureRandom.hex
    end while User.where(access_token: access_token).exists?
  end
end
