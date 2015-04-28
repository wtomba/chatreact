var LeftSideBar = React.createClass({displayName: "LeftSideBar",
  getInitialState: function () {
    var user = JSON.parse(localStorage.getItem('user'));

    return {
      user: user,
      user_users: [],
      users: [],
      conversation_users: [],
    };
  },
  componentDidMount: function () {    
    $(document).on('user', this.getUserConnectionsFromServer);
  },
  componentWillUnmount: function () {
    $(document).off('user');
  },
  getUserConnectionsFromServer: function (e, conversation_users) {
    var that = this,
        clone = null;
    $.ajax({
      url: '/loadSideBarContent/',
      dataType: 'json',
      type: 'GET',
      success: function (data) {
        this.setState({user_users: data, conversation_users: conversation_users}, function () {
          $(document).foundation();

          var that = this,
              clone = null;    

          $('.draggable').draggable({
            appendTo: '.exit-off-canvas',
            helper: function() {
              var element = $('<span id="'+this.id+'" class="clone">'+$(this).text()+'</span>');
              return element;
            },
            scroll: false,
            zIndex: 10000,
            revert: function(droppable) {
              if (droppable === false) {
                  $.ui.ddmanager.current.cancelHelperRemoval = true;
                  // Drop was rejected, tween back to original position.
                  TweenMax.to(clone, 0.5, { left: 0 - $("#left-side-bar").width(), top: clone.originalTop });
                  TweenMax.delayedCall(0.5, function () {
                    clone.remove();
                  });
              }
              return false;
            },
            start: function (event, ui) {
              clone = ui.helper;
              clone.originalLeft = $(this).offset().left;
              clone.originalTop = $(this).offset().top;
              $(this).css({opacity:0});
            },
            stop: function (event, ui) {
              var elem = this;
              TweenMax.delayedCall(0.5, function () {
                $(elem).css({opacity:1});
              });
            }
          });

          $('.exit-off-canvas').droppable({
            activeClass: "ui-state-hover",
            drop: function(event, ui) {
              $.ui.ddmanager.current.cancelHelperRemoval = true;

              var conversation = $(".active-conversation").attr("id");

              if (conversation) {
                var x = $(".attendees").last().position().left + ($(".attendees").last().outerWidth()),
                    y = $(".attendees").last().offset().top;
                TweenMax.to(ui.helper, 0.5, { left:x, top:y, width: "auto", height: 19, paddingLeft: 8, paddingTop: 4, paddingRight: 8, paddingBottom: 4, fontWeight: "400",
                                                backgroundColor: "#008CBA", color: "#FFF", fontSize: 11, lineHeight: 1, textAlign: "center", boxShadow: "none", borderRight: "1px dotted #FFF"});

                that.invitePerson(conversation, ui.helper.attr('id'));
                TweenMax.delayedCall(1, function () {
                  ui.helper.fadeOut().remove();
                });
              } else {
                var x = $(this).position().left;
                var y = $(this).position().top + 45;
                TweenMax.to(ui.helper, 0.2, { left:x, top:y, width: "auto", height: 19, paddingLeft: 8, paddingTop: 4, paddingRight: 8, paddingBottom: 4, backgroundColor: "#008CBA", 
                                              color: "#FFF", fontSize: 11, lineHeight: 1, textAlign: "center", borderRight: "1px dotted #FFF" });

                TweenMax.delayedCall(0.2, function () {
                  ui.helper.fadeOut().remove();
                  that.createConversation(ui.helper.attr('id'));
                });
              }
            }
          });
        });     
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this),
      beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Token token=" + this.state.user.token);
      }.bind(this),
    });
  },
  logOut: function (e) {
    e.preventDefault();

    localStorage.removeItem('user');
    React.unmountComponentAtNode(document.getElementById("main-section"));    
    React.unmountComponentAtNode(document.getElementById("right-side-bar"));
    $('.off-canvas-wrap').foundation('offcanvas', 'toggle', 'move-right');
    React.render(
      React.createElement(LoginForm, null),
      document.getElementById("main-section")
    );
  },
  toggleNotifications: function (e) {
    e.preventDefault();

    $.ajax({
      url: 'toggle_sound',
      dataType: 'json',
      type: 'GET',
      success: function (user) {
        if (user.id) {
          localStorage.setItem("user", JSON.stringify({token: user.access_token, username: user.username, id: user.id, notification_sounds: user.notification_sounds }));

          this.setState({
            user: JSON.parse(localStorage.getItem('user')),
          });
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
  getPeople: function (e) {
    e.preventDefault();

    AddUserModal.open({title: 'Lägg till person'});
  },
  removeUser: function (userToRemove) {
      $.ajax({
        url: '/users/connection',
        dataType: 'json',
        type: 'DELETE',
        data: {id: userToRemove},
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
  createConversation: function (user) {
      $.ajax({
        url: '/conversations',
        dataType: 'json',
        type: 'POST',
        data: {id: user},
        success: function (data) {
          if (data.id) {
            $(document).trigger("message", [data.id]);

            //$('.off-canvas-wrap').foundation('offcanvas', 'toggle', 'move-right');
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
  invitePerson: function (conversation, user) {
      $.ajax({
        url: '/conversations/'+ conversation +'/invite_person',
        dataType: 'json',
        type: 'POST',
        data: {id: user},
        success: function (data) {
          if (data.id) {
            //$('.off-canvas-wrap').foundation('offcanvas', 'toggle', 'move-right');
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
  render: function () {
    return (
      React.createElement("div", null, 
        React.createElement("ul", {className: "off-canvas-list"}, 
          React.createElement("li", null, React.createElement("label", null, "Du")), 
          React.createElement("li", null, 
            React.createElement("a", {href: "#", className: "profile-name", "data-options": "align:bottom;", "data-dropdown": "drop"+this.state.user.id, "aria-controls": "drop"+this.state.user.id, "aria-expanded": "false"}, this.state.user.username), 
            React.createElement("ul", {id: "drop"+this.state.user.id, "data-dropdown-content": true, className: "f-dropdown", "aria-hidden": "true", tabIndex: "-1"}, 
              React.createElement("li", null, React.createElement("a", {href: "#", onClick: this.toggleNotifications}, React.createElement(NotificationIcon, {user: this.state.user}))), 
              React.createElement("li", null, React.createElement("a", {href: "#", onClick: this.logOut}, "Logga ut"))
            )
          ), 
          React.createElement("li", null, React.createElement("label", null, "Dina vänner")), 
          React.createElement(ConnectionList, {conversation_users: this.state.conversation_users, users: this.state.user_users, removeUser: this.removeUser, createConversation: this.createConversation, invitePerson: this.invitePerson}), 
          React.createElement("li", null, React.createElement("a", {href: "#", className: "add-user", onClick: this.getPeople}, "Lägg till..."))
        )
      )
    );
  }
});

var NotificationIcon = React.createClass({displayName: "NotificationIcon",
  render: function () {
    var text = "",
        iconClass = "";

    if (this.props.user.notification_sounds) {
      text = "Stäng av ljudnotifikation";
      iconClass = "fi-volume-strike";
    } else {
      text = "Sätt på ljudnotifikation";
      iconClass = "fi-volume";
    }

    return (
      React.createElement("span", null, 
        React.createElement("i", {className: iconClass}), 
        React.createElement("p", {className: "text-center"}, text)
      )
    );
  }
});

var ConnectionList = React.createClass({displayName: "ConnectionList",
  handleRemoveClick: function (i, e) {
    e.preventDefault();

    var userToRemove = this.props.users[i].id;

    if (!userToRemove) {
      return;
    }

    this.props.removeUser(userToRemove);
  },
  handleCreateConversationClick: function (i, e) {
    e.preventDefault();

    var user = this.props.users[i].id;

    if (!user) {
      return;
    }

    this.props.createConversation(user);
  },
  handleInviteClick: function (i, e) {
    e.preventDefault();

    var user = this.props.users[i].id;
    var conversation = $(".active-conversation").attr("id");

    if (!user || !conversation) {
      return;
    }

    this.props.invitePerson(conversation, user);
  },
  render: function () {
    var attendee_ids = [];
    if (this.props.conversation_users) {
      for (var i = 0; i < this.props.conversation_users.length; i++) {
        attendee_ids.push(parseInt(this.props.conversation_users[i].id));
      }
    }

    var listNodes = this.props.users.map(function (user, i) {
      if (attendee_ids.indexOf(user.id) > -1) {
        return (
          React.createElement("li", {key: user.id}, 
            React.createElement("a", {href: "#", "data-dropdown": "drop"+user.id, "aria-controls": "drop"+user.id, "aria-expanded": "false"}, user.username), 
            React.createElement("ul", {id: "drop"+user.id, "data-dropdown-content": true, className: "f-dropdown", "aria-hidden": "true", tabIndex: "-1"}, 
              React.createElement("li", null, React.createElement("a", {href: "#", onClick: this.handleCreateConversationClick.bind(this, i)}, "Skapa konversation")), 
              React.createElement("li", null, React.createElement("a", {href: "#", onClick: this.handleRemoveClick.bind(this, i)}, "Ta bort"))
            )
          )
        );
      } else {
        return (
          React.createElement("li", {key: user.id}, 
            React.createElement("a", {className: "draggable", id: user.id, href: "#", "data-dropdown": "drop"+user.id, "aria-controls": "drop"+user.id, "aria-expanded": "false"}, 
              React.createElement("i", {className: "fi-arrows-out"}), 
              user.username
            ), 
            React.createElement("ul", {id: "drop"+user.id, "data-dropdown-content": true, className: "f-dropdown", "aria-hidden": "true", tabIndex: "-1"}, 
              React.createElement("li", null, React.createElement("a", {href: "#", onClick: this.handleCreateConversationClick.bind(this, i)}, "Skapa konversation")), 
              React.createElement("li", null, React.createElement("a", {href: "#", onClick: this.handleInviteClick.bind(this, i)}, "Bjud in till konversation")), 
              React.createElement("li", null, React.createElement("a", {href: "#", onClick: this.handleRemoveClick.bind(this, i)}, "Ta bort"))
            )
          )
        );
      }
    }, this);
    return (
      React.createElement("div", {id: "connections"}, 
        React.createElement(ReactCSSTransitionGroup, {transitionName: "message"}, 
          listNodes
        )
      )
    );
  }
});
