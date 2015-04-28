var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;

var ChatBox = React.createClass({displayName: "ChatBox",
  getInitialState: function () {
    var user = JSON.parse(localStorage.getItem('user'));
    return {messages: [],
            conversation: {
              id: "",
              users: []
            },
            user: user};
  },
  componentDidMount: function () {
    $(".title").text("Chatta");
    $(".left-small").show();
    $(".right-small").show();

    React.render(
      React.createElement(LeftSideBar, null),
      document.getElementById("left-side-bar")
    );

    React.render(
      React.createElement(RightSideBar, null),
      document.getElementById("right-side-bar")
    );


    $('#chat-textarea').keypress(function (e) {
      e = e || event;
      if(e.which === 13 && !e.shiftKey){
        $('#commentForm #submit').trigger("click");
        return false;
      }
    });
    
    this.loadMessagesFromServer();
    $(document).on('message', this.loadMessagesFromServer);
  },
  componentWillUnmount: function () {
    $(document).off('message');
    React.unmountComponentAtNode(document.getElementById("left-side-bar"));
    React.unmountComponentAtNode(document.getElementById("right-side-bar"));
  },
  loadMessagesFromServer: function (e, id) {
    var url = this.props.url;

    if (id && id != "leave") {
      url += "/"+ id;
    } else if (this.state.conversation.id && id != "leave") {
      url += "/"+ this.state.conversation.id;
    }

    $.ajax({
      url: url,
      dataType: 'json',
      success: function (data) {
        if (data.conversation) {
          var div = $("#messages");
          this.setState({messages: data.messages,
                          conversation: data.conversation}, function () {
                            TweenLite.to(div, 2, {scrollTo: { y: div[0].scrollHeight }, ease:Power2.easeOut});
                            $(document).trigger("user", [data.conversation.users]);
                          });
        } else {
          this.setState({messages: [{
            user: {
              username: "Server"
            },
            text: "Starta en konversation genom att navigera till menyn uppe till vänster och välj sedan en vän att prata med.",
            created_at: Date.now(),
          }], conversation: { id: "", users: []}}, function () {            
                                            React.render(
                                              React.createElement(LeftSideBar, null),
                                              document.getElementById("left-side-bar")
                                            );

                                            React.render(
                                              React.createElement(RightSideBar, null),
                                              document.getElementById("right-side-bar")
                                            );
                                        }
          );
          $(document).trigger("user", []);
        }
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this),
      beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Token token=" + this.state.user.token);
      }.bind(this),
    });
  },
  handleMessageSubmit: function (message, id) {
    var url = this.props.url+"/" + this.state.conversation.id;

    if (id) {
      url = url+"/messages/"+id;
    }
    $.ajax({
      url: url,
      dataType: 'json',
      type: 'POST',
      data: message,
      success: function (data) {
        // Nothing needed here because updates are handeled through websockets
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this),
      beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Token token=" + this.state.user.token);
      }.bind(this),
    });
  },
  handleMessageRemove: function (message) {
    $.ajax({
      url: '/messages',
      dataType: 'json',
      type: 'DELETE',
      data: {id: message},
      success: function (data) {
        // Nothing needed here because updates are handeled through websockets
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this),
      beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Token token=" + this.state.user.token);
      }.bind(this),
    });
  },
  render: function () {
    return (
      React.createElement("section", {className: "active-conversation", id: this.state.conversation.id}, 
        React.createElement("div", {className: "row"}, 
          React.createElement(AttendeeList, {attendees: this.state.conversation.users, current_user: this.state.user}), 
          React.createElement(MessageList, {messages: this.state.messages, handleMessageRemove: this.handleMessageRemove, current_user: this.state.user}), 
          React.createElement(MessageForm, {onMessageSubmit: this.handleMessageSubmit})
        )
      )
    );
  }
});

var MessageList = React.createClass({displayName: "MessageList",
  handleRemove: function (i, e) {
    e.preventDefault();

    var messageToRemove = this.props.messages[i].id;

    if (!messageToRemove) {
      return;
    }

    this.props.handleMessageRemove(messageToRemove);
  },
  handleEdit: function (i, e) {
    e.preventDefault();

    var messageToEdit = this.props.messages[i];

    if (!messageToEdit) {
      return;
    }

    $(".edit-message-id").val(messageToEdit.id);
    $("#chat-textarea").val(messageToEdit.text).focus();
  },
  render: function () {
    var messageNodes = this.props.messages.map(function (message, i) {
      return (
        React.createElement(Message, {key: message.id, 
                  author: message.user, 
                  user: this.props.current_user, 
                  created_at: message.created_at, 
                  updated_at: message.updated_at, 
                  id: message.id, 
                  removeMessage: this.handleRemove.bind(this, i), 
                  editMessage: this.handleEdit.bind(this, i)}, 
          message.text
        )
      )
    }, this);
    return (
      React.createElement("div", {id: "messages"}, 
        React.createElement(ReactCSSTransitionGroup, {transitionName: "message"}, 
          messageNodes
        )
      )
    );
  }
});

var Message = React.createClass({displayName: "Message",

  render: function () {
    var updated_at = new Date(this.props.updated_at),
        created_at = new Date(this.props.created_at),
        date = "";


    date = React.createElement(CreatedDate, {created: created_at})

    if (updated_at > created_at) {
      date = React.createElement(UpdatedDate, {updated: updated_at})
    }

    // Current user is owner of message
    if (this.props.user.username === this.props.author.username) {
      return (
        React.createElement("div", {key: this.props.id, className: "message"}, 
          React.createElement("blockquote", {className: "active"}, 
            React.createElement("a", {href: "#", className: "edit-message right", "data-options": "align:left;", "data-dropdown": "drop"+this.props.id, "aria-controls": "drop"+this.props.id, "aria-expanded": "false"}, React.createElement("i", {className: "fi-widget"})), 
            React.createElement("ul", {id: "drop"+this.props.id, "data-dropdown-content": true, className: "f-dropdown edit-message-dropdown", "aria-hidden": "true", tabIndex: "-1"}, 
              React.createElement("li", null, React.createElement("a", {href: "#", className: "edit", onClick: this.props.editMessage}, React.createElement("i", {className: "fi-pencil left"}), " Redigera")), 
              React.createElement("li", null, React.createElement("a", {href: "#", className: "remove", onClick: this.props.removeMessage}, React.createElement("i", {className: "fi-trash left"}), " Ta bort"))
            ), 
            React.createElement("p", null, 
              React.createElement("span", {dangerouslySetInnerHTML: {__html: linkify(this.props.children)}})
            ), 
            React.createElement("cite", null, 
              React.createElement("span", {className: "author active"}, this.props.author.username), 
              React.createElement("span", {className: "right"}, date)
            )
          )
        )
      );
    } else {
      return (
        React.createElement("div", {key: this.props.id, className: "message"}, 
          React.createElement("blockquote", null, 
            React.createElement("p", null, 
              React.createElement("span", {dangerouslySetInnerHTML: {__html: linkify(this.props.children)}})
            ), 
            React.createElement("cite", null, 
              React.createElement("span", {className: "author"}, this.props.author.username), 
              React.createElement("span", {className: "right"}, date)
            )
          )
        )
      );
    }
  }
});

var CreatedDate = React.createClass({displayName: "CreatedDate",
  render: function () {
    var date = "";
    if( (new Date(this.props.created)).setHours(0,0,0,0) === (new Date()).setHours(0,0,0,0) ) {
      date = (this.props.created.getHours() > 9 ? this.props.created.getHours() : "0"+this.props.created.getHours())+":"+
                (this.props.created.getMinutes() > 9 ? this.props.created.getMinutes() : "0"+this.props.created.getMinutes())+":"+
                  (this.props.created.getSeconds() > 9 ? this.props.created.getSeconds() : "0"+this.props.created.getSeconds());
    } else {
      date = (this.props.created.getMonth() + 1)+"/"+
                    this.props.created.getDate()+"/"+
                      this.props.created.getFullYear()+" - "+
                        (this.props.created.getHours() > 9 ? this.props.created.getHours() : "0"+this.props.created.getHours())+":"+
                          (this.props.created.getMinutes() > 9 ? this.props.created.getMinutes() : "0"+this.props.created.getMinutes())+":"+
                            (this.props.created.getSeconds() > 9 ? this.props.created.getSeconds() : "0"+this.props.created.getSeconds());
    }
    return (
      React.createElement("span", {className: "created-at"}, React.createElement("i", {className: "fi-calendar"}), " ", date)
    );
  }
});

var UpdatedDate = React.createClass({displayName: "UpdatedDate",
  render: function () {
    var date = "";
    if( (new Date(this.props.updated)).setHours(0,0,0,0) === (new Date()).setHours(0,0,0,0) ) {
      date = (this.props.updated.getHours() > 9 ? this.props.updated.getHours() : "0"+this.props.updated.getHours())+":"+
                (this.props.updated.getMinutes() > 9 ? this.props.updated.getMinutes() : "0"+this.props.updated.getMinutes())+":"+
                  (this.props.updated.getSeconds() > 9 ? this.props.updated.getSeconds() : "0"+this.props.updated.getSeconds());
    } else {
      date = (this.props.updated.getMonth() + 1)+"/"+
                    this.props.updated.getDate()+"/"+
                      this.props.updated.getFullYear()+" - "+
                        (this.props.updated.getHours() > 9 ? this.props.updated.getHours() : "0"+this.props.updated.getHours())+":"+
                          (this.props.updated.getMinutes() > 9 ? this.props.updated.getMinutes() : "0"+this.props.updated.getMinutes())+":"+
                            (this.props.updated.getSeconds() > 9 ? this.props.updated.getSeconds() : "0"+this.props.updated.getSeconds());
    }
    return (
      React.createElement("span", {className: "updated-at"}, React.createElement("i", {className: "fi-pencil"}), " ", date)
    );
  }
});

var AttendeeList = React.createClass({displayName: "AttendeeList",
  render: function () {
    var current_user = this.props.current_user;
    var attendeeNodes = this.props.attendees.map(function (attendee, i) {
      if (current_user.username === attendee.username){
        return (
          React.createElement("span", {className: "active label attendees", id: attendee.id, key: attendee.id}, attendee.username)
        );
      } else {
        return (
          React.createElement("span", {className: "label attendees", id: attendee.id, key: attendee.id}, attendee.username)
        );
      }
    });
    return (
      React.createElement("div", {id: "attendees"}, 
        React.createElement(ReactCSSTransitionGroup, {transitionName: "message"}, 
          attendeeNodes
        )
      )
    );
  }
});

var MessageForm = React.createClass({displayName: "MessageForm",
  handleSubmit: function (e) {
    e.preventDefault();
    var text = this.refs.text.getDOMNode().value.trim(),
        id = this.refs.id.getDOMNode().value.trim();

    if (!text) {
      return;
    }

    this.props.onMessageSubmit({text: text}, id);
    this.refs.text.getDOMNode().value = "";
    this.refs.id.getDOMNode().value = "";
  },
  render: function () {
    return (
      React.createElement("form", {id: "commentForm", className: "commentForm", onSubmit: this.handleSubmit}, 
        React.createElement("input", {name: "edit-message", ref: "id", className: "edit-message-id", type: "hidden", value: ""}), 
        React.createElement("div", {className: "row"}, 
          React.createElement("div", {className: "text-field small-12 large-12 columns"}, 
            React.createElement("label", null, 
              React.createElement("textarea", {placeholder: "Din meddelande här", ref: "text", id: "chat-textarea", required: true, rows: "3"})
            )
          )
        ), 
        React.createElement("div", {className: "row"}, 
          React.createElement("div", {className: "small-12 large-12 columns"}, 
            React.createElement("input", {id: "submit", className: "button small success right", type: "submit", value: "Skicka"})
          )
        )
      )
    );
  }
});
