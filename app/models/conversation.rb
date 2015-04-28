class Conversation < ActiveRecord::Base
  has_many :messages, :dependent => :delete_all
  has_and_belongs_to_many :users
  has_many :notifications, :dependent => :delete_all
end
