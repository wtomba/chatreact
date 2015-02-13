class CreateMessages < ActiveRecord::Migration
  def change
    create_table :messages do |t|
      t.belongs_to :user, index: true
      t.belongs_to :conversation, index: true
      t.string :text
      t.timestamps null: false
    end
  end
end
