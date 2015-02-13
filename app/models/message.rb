class Message < ActiveRecord::Base
  belongs_to :user
  belongs_to :conversation

  after_create {|message| message.message 'create'}
  after_destroy {|message| message.message 'destroy'}
  after_update {|message| message.message 'update'}

  def message action
    msg = {
      resource: 'message',
      action: action,
      id: self.id,
      obj: self
    }

    $redis.publish 'rt-change', msg.to_json
  end
end
