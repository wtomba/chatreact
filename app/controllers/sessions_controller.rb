class SessionsController < ApplicationController
  def new
  end

  def create
    user = User.find_by_username(params[:username])
    if user
      user = User.authenticate(params[:username], params[:password])
      if user
        session[:user_id] = user.id

        render :json => user.to_json
      else
        render :json => {:message => "Invalid username or password"}
      end
    else
      user = User.new
      user.username = params[:username]
      user.password = params[:password]

      if user.save
        session[:user_id] = user.id

        render :json => user.to_json
      else
        render :json => {:message => "Registration failed"}
      end
    end
  end

  def destroy
    session[:user_id] = nil
    render :json => {:message => "Success"}
  end
end
