window.AddUserModal = React.createClass({
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
                <AddUserModal title={props.title} />,
                $anchor.get(0)
            );

            var wrap = $(".off-canvas-wrap"),
                modal = $(".modal");

            TweenMax.to($("#modal-bg"), 0.75, { background: "rgba(0, 0, 0, .75)" })
            
            TweenMax.set(modal, {height: "auto", width: wrap.width() - 40, top: "15%" });
            TweenMax.from(modal, 1, { top: -$(".modal").height(), height: 0, width: wrap.width() - 40, ease: Elastic.easeOut });
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
          modalWidth = modal.width();

      if (!this.state.animation_running) {
        this.setState({ animation_running: true });

        TweenMax.set($("#modal-bg"), { background: "rgba(0, 0, 0, 0)" });
        TweenMax.from($("#modal-bg"), 0.75, { background: "rgba(0, 0, 0, 0.75)" });

        TweenMax.set(modal, { width: modalWidth, top: -modal.height(), height: 0 });
        TweenMax.from(modal, 1, { width: modalWidth, height: modalHeight, top: "15%", ease: Sine.easeOut, onComplete: function () {
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
        <div>
          <div id="modal-bg" onClick={this.closeHandler}></div>
          <div className="modal">
            <div className="large-12 columns header">
              <i className="fi-magnifying-glass left"></i>
              <span>{this.props.title}</span>
              <i onClick={this.closeHandler} className="fi-x right close"></i>
            </div>
            <div className="large-12 columns">
                <input type="text" className="search-input" placeholder="Sök på användarnann" ref="query" onChange={this.handleQuery} required />
            </div>
            <div className="large-12 columns result">
              <div className="large-12 columns icon">
                <i className="fi-results-demographics"></i>
              </div>
              <UsersList addUser={this.addUser} users={this.state.users} />
            </div>
          </div>
        </div>
      )
    }
});

var UsersList = React.createClass({
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
                    <li key={user.id} onClick={this.handleClick.bind(this, i)}>
                      <div className="user">
                        <i className="fi-torsos-male-female"></i>
                        <p>{user.username}</p>
                      </div>
                    </li>
                  );
                }, this);
    if (users.length === 0) {
      return (  
        <ul className="large-block-grid-1 medium-block-grid-1 small-block-grid-1" onClick={this.focusInput}>
          <li>
            <div className="no-users">
              <i className="fi-zoom-out"></i>
              <p>Inga träffar försök igen</p>
            </div>
          </li>
        </ul>
      );
    } else {
      return (  
        <ReactCSSTransitionGroup transitionName="message" component="ul" className="large-block-grid-3 medium-block-grid-3 small-block-grid-3">
          {users}
        </ReactCSSTransitionGroup>
      );
    }
  }
});
