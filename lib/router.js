Router.configure({
	layoutTemplate: 'layout',
  loadingTemplate: 'loading',
  notFoundTemplate: 'notFound',
	waitOn: function() {
		Meteor.subscribe('posts');
	}
});

// home page
Router.route('/', {name: 'postsList'});

// dynamic posts router
Router.route('/posts/:_id', {
	name: 'postPage',
	data: function() {
		return Posts.findOne(this.params._id);
	}
});

Router.onBeforeAction('dataNotFound', {only: 'postPage'});