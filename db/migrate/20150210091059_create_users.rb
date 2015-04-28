class CreateUsers < ActiveRecord::Migration
  def change
    create_table :users do |t|
      t.string :username
      t.string :password_hash
      t.string :password_salt
      t.string :access_token
      t.boolean :notification_sounds, :default => 1

      t.timestamps null: false
    end
  end
end
