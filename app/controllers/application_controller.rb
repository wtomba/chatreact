require "application_responder"

class ApplicationController < ActionController::Base
  self.responder = ApplicationResponder
  respond_to :html

  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception
  helper_method :current_user

  def authenticate_api_user
    authenticate_or_request_with_http_token do |token, options|
      user = User.where(access_token: token).first

      @current_user = user if user
    end
  end

  private
  def current_user
    if session[:user_id] && User.exists?(:id => session[:user_id])
      @current_user = User.find(session[:user_id])
    else
      session[:user_id] = nil
    end
  end
end
