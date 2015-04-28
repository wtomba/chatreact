class ApiController < ApplicationController
  respond_to :json
  before_filter :authenticate_api_user
  skip_before_filter :authenticate_api_user, :only => [:login, :register]

  def login
    user = User.find_by_username(params[:username])
    if user
      user = User.authenticate(params[:username], params[:password])
      if user
        session[:user_id] = user.id

        render :json => user.as_json(:except => [:password_hash, :password_salt, :notification_sounds, :created_at, :updated_at])
      else
        render :json => {:message => "Fel användarnamn eller lösenord"}
      end
    else
      render :json => {:message => "Fel användarnamn eller lösenord"}
    end
  end 

  def register
    user = User.find_by_username(params[:username])

    if user
      render :json => {:message => "Anvädarnamnet är upptaget försök med ett annat"}
    else
      if params[:password] == params[:password_confirmation]
        user = User.new
        user.username = params[:username]
        user.password = params[:password]

        if user.save
          session[:user_id] = user.id

          render :json => user.as_json(:except => [:password_hash, :password_salt, :notification_sounds, :created_at, :updated_at])
        else
          render :json => {:message => "Något gick fel i registreringen, försök igen"}
        end
      else
        render :json => {:message => "Lösenord och lösenordsbekräftelse stämmer inte överens"}
      end
    end
  end

  def toggle_sound
    user = @current_user

    if user.update_attribute(:notification_sounds, user.notification_sounds ? false : true)
      render :json => user
    else 
      render :json => { :message => "Något gick fel när notifikationerna skulle slås av/på" }
    end
  end

  def load_side_bar_content
    user = @current_user

    if user
      render :json => user.users.as_json(:except => [:access_token, :password_hash, :password_salt, :notification_sounds, :created_at, :updated_at])
    end
  end

  def users
    ids = @current_user.user_ids
    ids << @current_user.id
    users = User.where.not(id: ids)

    render :json => users.to_json
  end

  def query_users
    query = (params[:username].strip)
    ids = @current_user.user_ids
    ids << @current_user.id

    if query
      users = User.where("username LIKE ?", "%#{query}%").where.not(id: ids)

      if users.any?
        render :json => users.as_json(:except => [:access_token, :password_hash, :password_salt, :notification_sounds, :created_at, :updated_at])
      else
        render :json => {:message => "Sökningen på \"" +query+ "\" gav inga träffar"}
      end
    else
      render :json => {:message => "Måste ange en söksträng"}
    end
  end

  def add_user_connection
    user = @current_user
    user_to_add = User.find(params[:id])

    user.users << user_to_add

    if user.save
      redis_publish("user", [user.id])
      render :json => {:message => "success"}
    end
  end

  def delete_user_connection
    user = @current_user
    user_to_remove = User.find(params[:id])
    user.users.delete(user_to_remove)

    if user.save
      redis_publish("user", [user.id])
      render :json => {:message => "success"}
    end
  end

  def create_conversation
    user = @current_user
    with_user = User.find(params[:id])
    
    conversation = Conversation.new
    conversation.users << [user, with_user]
    conversation.name = conversation.users.collect(&:username).join(', ')

    if conversation.save
      conversation.messages << Message.create(:text => "Startade konversation", :user_id => @current_user.id, :conversation_id => conversation.id)
      notification = Notification.create(:user_id => with_user.id, :conversation_id => conversation.id)

      redis_publish("conversation", conversation.users.pluck(:id))
      render :json => {:id => conversation.id}
    else
      render :json => {:message => "Failed"}
    end
  end

  def change_conversation_name
    conversation = Conversation.find(params[:id])

    if params[:name]
      conversation.name = params[:name]

      if conversation.save
        redis_publish("conversation", conversation.users.pluck(:id))

        render :json => { :message => "success" }
      end
    else
      render :json => { :message => "Konversationsnamnet får inte vara tomt" }
    end
  end

  def invite_person
    user = User.find(params[:id])
    conversation = Conversation.find(params[:conversation_id])

    if !conversation.users.include?(user)


      if (conversation.name == conversation.users.collect(&:username).join(', '))
        conversation.users << user
        conversation.name = conversation.users.collect(&:username).join(', ')
      else
        conversation.users << user
      end

      if conversation.save
        conversation.messages << Message.create(:text => "Gick med i konversation", :user_id => user.id, :conversation_id => conversation.id)
        notification = Notification.create(:user_id => user.id, :conversation_id => conversation.id)

        redis_publish("message", conversation.users.pluck(:id))
        redis_publish("conversation", conversation.users.pluck(:id))
        render :json => {:id => conversation.id}
      end
    else
      render :json => {:message => "Person is already in the conversation"}
    end
  end

  def get_conversations
    conversations = @current_user.conversations
    notifications = conversations.includes(:notifications).where(notifications: {user_id: @current_user.id})

    render :json => { :conversations => conversations.order('updated_at DESC').as_json(:include => [:users => { :except => [:access_token, :password_hash, :password_salt, :notification_sounds, :created_at, :updated_at] }]), 
                        :notifications => notifications.as_json(:include => [:notifications]) }
  end

  def get_conversation
    if params[:id]
      conversation = Conversation.find(params[:id])
    else
      message = Message.includes(:conversation).where(:user_id => @current_user.id).order('updated_at DESC').first
      if message.present? && message.conversation.users.where(:id => @current_user.id).any?
        conversation = message.conversation
      end
    end
    
    if conversation.present?
      conversation.notifications.where(:user_id => @current_user.id).each do |n|
        Notification.find(n).destroy
      end
    end

    if conversation
      render :json => { :conversation => conversation.as_json(:include => [:users => { :except => [:access_token, :password_hash, :password_salt, :notification_sounds, :created_at, :updated_at] }]), 
                          :messages => conversation.messages.as_json(:include => [:user => { :except => [:access_token, :password_hash, :password_salt, :notification_sounds, :created_at, :updated_at] }]) }
    else
      render :json => {:message => "No conversation"}
    end
  end

  def leave_conversation
    conversation = Conversation.find(params[:id])

    if (conversation.name == conversation.users.collect(&:username).join(', '))
      conversation.users.delete(@current_user)
      conversation.name = conversation.users.collect(&:username).join(', ')
      conversation.save
    else 
      conversation.users.delete(@current_user)
    end

    if conversation.users.any?
      conversation.messages << Message.create(:text => "Lämnade konversation", :user_id => @current_user.id, :conversation_id => conversation.id)
      redis_publish("message", conversation.users.pluck(:id))
      redis_publish("conversation", conversation.users.pluck(:id) << @current_user.id)
    else
      redis_publish("conversation", conversation.users.pluck(:id) << @current_user.id)
      conversation.destroy
    end

    render :json => {:message => "success"}
  end

  def add_message
    conversation = Conversation.find(params[:id])
    message = Message.new
    message.user = @current_user
    message.text = params[:text]
    message.conversation = conversation

    if message.save
      conversation.users.each do |u|
        if u != @current_user
          notification = Notification.create(:user => u, :conversation => conversation)
        end
      end
      redis_publish("message", conversation.users.pluck(:id))
      sleep(0.1)
      redis_publish("conversation", conversation.users.where.not(id: @current_user.id).pluck(:id))
      
      render :json => {:message => "success"}
    end
  end

  def edit_message
    message = Message.find(params[:message_id])
    message.text = params[:text]

    if message.save
      redis_publish("message", message.conversation.users.pluck(:id))
      render :json => {:message => "success"}
    end
  end

  def delete_message
    message = Message.find(params[:id])
    if message.user == @current_user
      redis_publish("message", message.conversation.users.pluck(:id))
      message.destroy
      render :json => {:message => "success"}
    else
      render :json => {:message => "not allowed"}, :status => :unauthorized
    end
  end

  def redis_publish(model, users)   
      msg = {
        resource: model,
        users: users
      }

      $redis.publish 'rt-change', msg.to_json
  end
end
