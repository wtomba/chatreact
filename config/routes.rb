Rails.application.routes.draw do
  # The priority is based upon order of creation: first created -> highest priority.
  # See how all your routes lay out with "rake routes".

  # You can have the root of your site routed with "root"
  root 'users#index'

  post 'register' => 'api#register'
  post 'login' => 'api#login'
  get 'toggle_sound' => 'api#toggle_sound'

  get 'users' => 'api#users'
  get 'users/query/:username' => 'api#query_users'
  post 'users/connection' => 'api#add_user_connection'
  delete 'users/connection' => 'api#delete_user_connection'

  post 'sessions' => 'sessions#create'
  delete 'sessions' => 'sessions#destroy'

  get 'loadSideBarContent/' => 'api#load_side_bar_content'


  post 'conversations' => 'api#create_conversation'
  post 'conversations/:conversation_id/invite_person/' => 'api#invite_person'
  post 'conversations/:id/change_name' => 'api#change_conversation_name'
  get 'all_conversations' => 'api#get_conversations'
  get 'conversations(/:id)' => 'api#get_conversation'
  delete 'conversations/:id' => 'api#leave_conversation'
  post 'conversations/:id' => 'api#add_message'
  post 'conversations/:id/messages/:message_id' => 'api#edit_message'
  delete 'messages' => 'api#delete_message'

  # Example of regular route:
  #   get 'products/:id' => 'catalog#view'

  # Example of named route that can be invoked with purchase_url(id: product.id)
  #   get 'products/:id/purchase' => 'catalog#purchase', as: :purchase

  # Example resource route (maps HTTP verbs to controller actions automatically):
  #   resources :products

  # Example resource route with options:
  #   resources :products do
  #     member do
  #       get 'short'
  #       post 'toggle'
  #     end
  #
  #     collection do
  #       get 'sold'
  #     end
  #   end

  # Example resource route with sub-resources:
  #   resources :products do
  #     resources :comments, :sales
  #     resource :seller
  #   end

  # Example resource route with more complex sub-resources:
  #   resources :products do
  #     resources :comments
  #     resources :sales do
  #       get 'recent', on: :collection
  #     end
  #   end

  # Example resource route with concerns:
  #   concern :toggleable do
  #     post 'toggle'
  #   end
  #   resources :posts, concerns: :toggleable
  #   resources :photos, concerns: :toggleable

  # Example resource route within a namespace:
  #   namespace :admin do
  #     # Directs /admin/products/* to Admin::ProductsController
  #     # (app/controllers/admin/products_controller.rb)
  #     resources :products
  #   end
end
