var RightSideBar = React.createClass({displayName: "RightSideBar",
  getInitialState: function () {
    var user = JSON.parse(localStorage.getItem('user'));

    return {
      conversations: [],
      notifications: [],
      user: user,
      interval: "",
      blurred: false
    };
  },
  componentDidMount: function () {
    this.getConversations();
    $(document).on('conversation', this.getConversations);
  },
  componentWillUnmount: function () {
    $(document).off('conversation');
  },
  getConversations: function () {
      $.ajax({
        url: 'all_conversations',
        dataType: 'json',
        type: 'GET',
        success: function (data) {
          this.setState({conversations: data.conversations,
                          notifications: data.notifications});


          if (data.notifications.length > 0) {
            $(".right-off-canvas-toggle i").css("color", "rgb(60, 187, 17)");

            this.setState({
              blurred: true,
              interval: window.setInterval(function() {
                            document.title = document.title == "ReactTest" ? "Nytt meddelande" : "ReactTest";
                         }, 1500),
            });
          } else {
            $(".right-off-canvas-toggle i").css("color", "#FFF");
            document.title = "ReactTest";

            clearInterval(this.state.interval);
            this.setState({
              blurred: false,
              interval: "",
            });
          }
          $(document).foundation();
        }.bind(this),
        error: function (xhr, status, err) {
          console.error(this.props.url, status, err.toString());
        }.bind(this),
        beforeSend: function (xhr) {
            xhr.setRequestHeader ("Authorization", "Token token=" + this.state.user.token);
        }.bind(this),
      });
  },
  openConversation: function (id) {    
    $(document).trigger("message", [id]);
    var that = this;
    setTimeout(function () {
      that.getConversations();
    }, 200);
    $('.off-canvas-wrap').foundation('offcanvas', 'toggle', 'move-left');
  },
  leaveConversation: function (id) {
      $.ajax({
        url: 'conversations/'+id,
        dataType: 'json',
        type: 'DELETE',
        success: function (data) {          
          $(document).trigger("message", ["leave"]);
          $('.off-canvas-wrap').foundation('offcanvas', 'toggle', 'move-left');
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
      React.createElement("div", null, 
        React.createElement("ul", {className: "off-canvas-list"}, 
          React.createElement("li", null, React.createElement("label", null, "Konversationer")), 
          React.createElement(ConversationList, {conversations: this.state.conversations, notifications: this.state.notifications, openConversation: this.openConversation, leaveConversation: this.leaveConversation})
        )
      )
    );
  },
});

var ConversationList = React.createClass({displayName: "ConversationList",
  openConversation: function (i, e) {
    e.preventDefault();

    var id = this.props.conversations[i].id,
        children = this.getDOMNode().childNodes[0].childNodes;

    if(!id) {
      return;
    }


    for (var p = 0; p < children.length; p++) {
      if (children[p].className == "active") {
        children[p].className = "";
      }
    }
    children[i].className = "active";
    this.props.openConversation(id);
  },
  leaveConversation: function (i, e) {
    e.preventDefault();

    var id = this.props.conversations[i].id;

    if (!id) {
      return;
    }

    this.props.leaveConversation(id);
  },
  editConversationName: function (i, e) {
    e.preventDefault();

    var id = this.props.conversations[i].id,
        name = this.props.conversations[i].name;

    if (!id || !name) {
      return;
    }

    ConversationNameModal.open({ title: "Ändra namn", name: name, id: id });
  },
  render: function () {
    var listNodes = this.props.conversations.map(function (conversation, i) {
      var notifications = [];
      for (var d = this.props.notifications.length - 1; d >= 0; d--) {
        if (this.props.notifications[d].id == conversation.id)
        {
          notifications = this.props.notifications[d].notifications;
        }
      };
      return (
        React.createElement("li", {ref: "conversation", key: conversation.id, className: $(".active-conversation").attr("id") == conversation.id ? "active conversation " + conversation.id : "conversation " + conversation.id}, 
          React.createElement("a", {href: "#", onClick: this.openConversation.bind(this, i)}, React.createElement("span", {className: "notifications"}, React.createElement("span", null, notifications.length)), " ", conversation.name), 
          React.createElement("a", {href: "#", className: "settings", "data-dropdown": "drop"+conversation.id, "aria-controls": "drop"+conversation.id, "aria-expanded": "false", "data-options": "align:left;"}, 
            React.createElement("i", {className: "fi-widget"})
          ), 
          React.createElement("ul", {id: "drop"+conversation.id, "data-dropdown-content": true, className: "f-dropdown", "aria-hidden": "true", tabIndex: "-1"}, 
            React.createElement("li", null, React.createElement("a", {href: "#", className: "text-center change-conversation-name", onClick: this.editConversationName.bind(this, i)}, React.createElement("i", {className: "fi-wrench left"}), " Ändra namn")), 
            React.createElement("li", null, React.createElement("a", {href: "#", className: "text-center", onClick: this.leaveConversation.bind(this, i)}, React.createElement("i", {className: "fi-x left"}), " Lämna"))
          )
        )
      );
    }, this);
    return (
      React.createElement("div", {id: "conversations"}, 
        React.createElement(ReactCSSTransitionGroup, {transitionName: "message"}, 
          listNodes
        )
      )
    );
  },
});
