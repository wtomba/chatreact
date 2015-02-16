class Conversation < ActiveRecord::Base
  has_many :messages
  has_and_belongs_to_many :users
  has_many :notifications

  after_create {|conversation| conversation.message 'create'}
  after_destroy {|conversation| conversation.message 'destroy'}
  after_update {|conversation| conversation.message 'update'}
  after_touch {|conversation| conversation.message 'update'}


  def message action
    msg = {
      resource: 'conversation',
      action: action,
      id: self.id,
      obj: self
    }

    $redis.publish 'rt-change', msg.to_json
  end
end
