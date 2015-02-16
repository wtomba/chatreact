class ApiController < ApplicationController
  respond_to :json
  before_filter :authenticate_api_user
  skip_before_filter :authenticate_api_user, :only => :login
  def login
    user = User.find_by_username(params[:username])
    if user
      user = User.authenticate(params[:username], params[:password])
      if user
        session[:user_id] = user.id

        render :json => user
      else
        render :json => {:message => "Invalid username or password"}
      end
    else
      user = User.new
      user.username = params[:username]
      user.password = params[:password]

      if user.save
        session[:user_id] = user.id

        render :json => user
      else
        render :json => {:message => "Registration failed"}
      end
    end
  end

  def load_side_bar_content
    user = @current_user

    if user
      render :json =>  user.users
    end
  end

  def users
    ids = @current_user.user_ids
    ids << @current_user.id
    users = User.where.not(id: ids)

    render :json => users.to_json
  end

  def add_user_connection
    user = @current_user
    user_to_add = User.find(params[:id])

    user.users << user_to_add

    if user.save
      render :json => {:message => "success"}
    end
  end

  def delete_user_connection
    user = @current_user
    user_to_remove = User.find(params[:id])
    user.users.delete(user_to_remove)

    if user.save
      render :json => {:message => "success"}
    end
  end

  def create_conversation
    user = @current_user
    with_user = User.find(params[:id])

    conversation = Conversation.new
    conversation.users << [user, with_user]

    if conversation.save
      render :json => {:id => conversation.id}
    else
      render :json => {:message => "Failed"}
    end
  end

  def get_conversations
    conversations = @current_user.conversations.order('updated_at DESC')

    render :json => { :conversations => conversations.as_json(:include => [:users, :notifications]) }
  end

  def get_conversation
    if params[:id]
      conversation = Conversation.find(params[:id])
    else
      conversation = @current_user.conversations.order('updated_at DESC').first
    end

    conversation.notifications.where(:user_id => @current_user.id).each do |n|
      n.destroy
    end

    if conversation
      render :json => { :conversation => conversation.as_json(:include => :users), :messages => conversation.messages.as_json(:include => :user) }
    else
      render :json => {:message => "No conversation"}
    end
  end

  def leave_conversation
    conversation = Conversation.find(params[:id])

    conversation.users.delete(@current_user)

    if conversation.users.any?
      conversation.touch
    else
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
      conversation.touch

      conversation.users.each do |u|
        if u != @current_user
          notification = Notification.new
          notification.user = u
          notification.conversation = conversation

          notification.save
        end
      end
      render :json => {:message => "success"}
    end
  end

  def delete_message
    message = Message.find(params[:id])
    if message.user == @current_user
      message.destroy
      render :json => {:message => "success"}
    else
      render :json => {:message => "not allowed"}, :status => :unauthorized
    end
  end
end
