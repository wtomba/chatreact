# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20150216144153) do

  create_table "conversations", force: :cascade do |t|
    t.string   "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "conversations_users", id: false, force: :cascade do |t|
    t.integer "user_id"
    t.integer "conversation_id"
  end

  add_index "conversations_users", ["conversation_id"], name: "index_conversations_users_on_conversation_id"
  add_index "conversations_users", ["user_id"], name: "index_conversations_users_on_user_id"

  create_table "messages", force: :cascade do |t|
    t.integer  "user_id"
    t.integer  "conversation_id"
    t.string   "text"
    t.datetime "created_at",      null: false
    t.datetime "updated_at",      null: false
  end

  add_index "messages", ["conversation_id"], name: "index_messages_on_conversation_id"
  add_index "messages", ["user_id"], name: "index_messages_on_user_id"

  create_table "notifications", force: :cascade do |t|
    t.integer  "user_id"
    t.integer  "conversation_id"
    t.datetime "created_at",      null: false
    t.datetime "updated_at",      null: false
  end

  add_index "notifications", ["conversation_id"], name: "index_notifications_on_conversation_id"
  add_index "notifications", ["user_id"], name: "index_notifications_on_user_id"

  create_table "user_connections", id: false, force: :cascade do |t|
    t.integer "user_a_id", null: false
    t.integer "user_b_id", null: false
  end

  create_table "users", force: :cascade do |t|
    t.string   "username"
    t.string   "password_hash"
    t.string   "password_salt"
    t.string   "access_token"
    t.boolean  "notification_sounds", default: true
    t.datetime "created_at",                         null: false
    t.datetime "updated_at",                         null: false
  end

end
