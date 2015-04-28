window.AddUserModal = React.createClass({displayName: "AddUserModal",
    propTypes: {
        title:      React.PropTypes.string.isRequired
    },
    statics: {

        // open a dialog with props object as props
        open: function(props) {
            var $anchor = $('#dialog-anchor');

            if (!$anchor.length) {
                $anchor = $('<div></div>')
                    .prop('id', 'dialog-anchor')
                    .appendTo('body');
            }
            React.render(
                React.createElement(AddUserModal, {title: props.title}),
                $anchor.get(0)
            );

            var wrap = $(".off-canvas-wrap"),
                modal = $(".modal"), 
                padding = 20,
                left = wrap.offset().left;

            console.log(wrap.offset().left);

            TweenMax.to($("#modal-bg"), 0.75, { background: "rgba(0, 0, 0, .75)" })
            TweenMax.set(modal, { left: left + padding, width: wrap.outerWidth() - padding*2, height: "auto", top: "15%" });
            TweenMax.from(modal, 1, { left: left + padding, width: wrap.outerWidth() - padding*2, top: -$(".modal").height(), height: 0, ease: Elastic.easeOut });

            console.log(modal.offset().left);
        },

        // close a dialog
        close: function() {
          React.unmountComponentAtNode($('#dialog-anchor').get(0));
        }
    },
    
    getInitialState: function () {
      var user = JSON.parse(localStorage.getItem('user'));

      return {
        user: user,
        user_users: [],
        users: [],
        animation_running: false,
      };
    },

    // when dialog opens, add a keyup event handler to body
    componentDidMount: function() {
        $('body').on('keyup.myDialog', this.globalKeyupHandler);
    },

    // when dialog closes, clean up the bound keyup event handler on body
    componentWillUnmount: function() {
        $('body').off('keyup.myDialog');
    },

    // handles keyup events on body
    globalKeyupHandler: function(e) {
        if (e.keyCode == 27) { // ESC key
          AddUserModal.close();
        }
    },

    closeHandler: function () {
      var wrap = $("#inner-container"),
          modal = $(".modal"),
          modalHeight = modal.height(),
          padding = 20;

      if (!this.state.animation_running) {
        this.setState({ animation_running: true });

        TweenMax.set($("#modal-bg"), { background: "rgba(0, 0, 0, 0)" });
        TweenMax.from($("#modal-bg"), 0.75, { background: "rgba(0, 0, 0, 0.75)" });
        console.log(wrap.offset().left);
        TweenMax.set(modal, { left: wrap.offset().left + padding, width: wrap.outerWidth() - padding*2, top: -$(".modal").height(), height: 0 });
        TweenMax.from(modal, 1, { left: wrap.offset().left + padding, width: wrap.outerWidth() - padding*2, height: modalHeight, top: "15%", ease: Sine.easeOut, onComplete: function () {
          this.setState({ animation_running: false });
          AddUserModal.close();
        }.bind(this) });
      }
    },

    handleQuery: function () {
      var query = this.refs.query.getDOMNode().value.trim(),
          that = this;

      if (!query) {
        return;
      }

      if (typeof(window.delayer) != "undefined") {
        clearTimeout(window.delayer);
      }

      window.delayer = 
        setTimeout(function () {
          $.ajax({
            url: '/users/query/' + query,
            dataType: 'json',
            type: 'GET',
            success: function (data) {
              if (!data.message) {
                that.setState({users: data});
              } else {
                that.setState({users: []});
              }

              if ($(".result").height() === 0) {
                TweenMax.set($(".result"), { height: "auto", autoAlpha: 1 });
                TweenMax.from($(".result"), 1, { height: "0px", autoAlpha: 0, ease: Elastic.easeOut });
              }
            }.bind(this),
            error: function (xhr, status, err) {
              console.error(this.props.url, status, err.toString());
            }.bind(this),
            beforeSend: function (xhr) {
              xhr.setRequestHeader ("Authorization", "Token token=" + that.state.user.token);
            }.bind(this),
          });
        }, 500);
    },

    addUser: function (userToAdd) {
        $.ajax({
          url: '/users/connection',
          dataType: 'json',
          type: 'POST',
          data: {id: userToAdd},
          success: function (data) {
            this.closeHandler();
          }.bind(this),
          error: function (xhr, status, err) {
            console.error(this.props.url, status, err.toString());
          }.bind(this),
          beforeSend: function (xhr) {
            xhr.setRequestHeader ("Authorization", "Token token=" + this.state.user.token);
          }.bind(this),
        });
    },

    render: function() {
      return (
        React.createElement("div", null, 
          React.createElement("div", {id: "modal-bg", onClick: this.closeHandler}), 
          React.createElement("div", {className: "modal"}, 
            React.createElement("div", {className: "large-12 columns header"}, 
              React.createElement("i", {className: "fi-magnifying-glass left"}), 
              React.createElement("span", null, this.props.title), 
              React.createElement("i", {onClick: this.closeHandler, className: "fi-x right close"})
            ), 
            React.createElement("div", {className: "large-12 columns"}, 
                React.createElement("input", {type: "text", className: "search-input", placeholder: "Sök på användarnann", ref: "query", onChange: this.handleQuery, required: true})
            ), 
            React.createElement("div", {className: "large-12 columns result"}, 
              React.createElement("div", {className: "large-12 columns icon"}, 
                React.createElement("i", {className: "fi-results-demographics"})
              ), 
              React.createElement(UsersList, {addUser: this.addUser, users: this.state.users})
            )
          )
        )
      )
    }
});

var UsersList = React.createClass({displayName: "UsersList",
  handleClick: function (i, e) {
    e.preventDefault();

    var userToAdd = this.props.users[i].id;

    if (!userToAdd) {
      return;
    }

    this.props.addUser(userToAdd);
  },
  focusInput: function (i, e) {
    $(".search-input").focus().select();
  },
  render: function () {
    var users = this.props.users.map(function (user, i) {
                  return (
                    React.createElement("li", {key: user.id, onClick: this.handleClick.bind(this, i)}, 
                      React.createElement("div", {className: "user"}, 
                        React.createElement("i", {className: "fi-torsos-male-female"}), 
                        React.createElement("p", null, user.username)
                      )
                    )
                  );
                }, this);
    if (users.length === 0) {
      return (  
        React.createElement("ul", {className: "large-block-grid-1 medium-block-grid-1 small-block-grid-1", onClick: this.focusInput}, 
          React.createElement("li", null, 
            React.createElement("div", {className: "no-users"}, 
              React.createElement("i", {className: "fi-zoom-out"}), 
              React.createElement("p", null, "Inga träffar försök igen")
            )
          )
        )
      );
    } else {
      return (  
        React.createElement(ReactCSSTransitionGroup, {transitionName: "message", component: "ul", className: "large-block-grid-3 medium-block-grid-3 small-block-grid-3"}, 
          users
        )
      );
    }
  }
});
