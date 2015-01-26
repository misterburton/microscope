# Discover Meteor Notes

[book.discovermeteor.com](https://book.discovermeteor.com)

## Setup

### create a simple app
`meteor create appName`

cd into appName & remove default files

### to run app
`meteor`

### initialize repo w/ git
`git init`

### create 4 folders in your app directory
- client
- server
- public
- lib

### notes regarding this folder structure:
- code in 'server' only runs on server
- code in 'client' only runs on client
- everything else runs in both client & server
- static assets go in 'public'
- files in 'lib' are loaded before anything else
- any main.* file is loaded after everything else

### 2 reasons to ever go into the hidden .meteor directory:
- .meteor/packages to list your smart packages
- .meteor/release version of meteor to use



## Deployment

### Deploying on meteor subdomain

meteor deploy appName.meteor.com

### Deploying on Modulus
##### production ready PaaS (platform-as-a-service) provider that officially supports meteor

download 'demeteorizer' - open source tool that converts meteor app into a standard node.js app

modulus.io - create account

`npm install -g demeteorizer`

etc … (refer to chapter 2.5 of 'discover meteor' book)

### Deploying on your own server via Meteor Up

Digital Ocean, AWS, etc. — more work, DO = most full featured option

## Templates

### File Structure

- Meteor is great at finding files
- No need to manually write include paths for .js or .css files
- Meteor will find and compile all file, properly

### How Templates Work

- templates have name attributes (i.e. template name="postsList")
- this is the name meteor will use to keep track of what template goes where
- the name of the actual file is not relevant, only the name attribute in the post list

### Spacebars - Meteor's Templating System

- inclusions/partials {{ >templateName }}
- expressions {{ title }}
- block helpers {{ #each }}…{{ #/each }} or {{ #if }}…{{ #/if }}

## Collections

- to make a collection available whole app, don't use var
- i.e. Posts = new Mongo.Collection('posts');
- code inside folders other than `client` or `server` will run in both contexts

## Populating the Database

- `meteor reset` erases the database (be careful w/ this command in production, obvs)
- in `server/fixtures.js`, check to see if database is empty via `Posts.find().count() === 0`
- if so, populate w/ JSON data via `Posts.insert({…})`
- you can also populate the database via the above method from the browser console
- to check the contents of the database via the terminal, `meteor mongo` and then `db.posts.find()`

### Autopublish

autopublish package is included by default, which says that each collection should be shared, in its entirety, w/ each connected client. this is not intended for production apps. to remove it, in terminal, type:

 `meteor remove autopublish`
 
rather than relying on the `autopublish` package, we instead use `Meteor.publish('posts', …)` on the server side, and `Meteor.subscribe('posts')` on the client side

## Publications and Subscriptions

same concept as broadcasters & listeners

how to publish only unflagged posts to the client, keeping our app secure

```
Meteor.publish('posts', function() {
	return Posts.find({flagged: false});
});
```

any data you subscribe to will be *mirrored* on the client via Minimongo

if we want to show posts only from a certaion author, on the server:

```
Meteor.publish('posts', function() {
	return Posts.find({flagged: false, author: author});
});
```

on the client:

```
Meteor.subscribe('posts', 'Caleb Larsen');
```

this is how we make our app scalable on the client side, by picking & choosing what parts of the available data we need.

to find posts written by caleb, but only those of a particular category:

```
Template.posts.helpers({
	posts: function() {
		return Posts.find({author: 'Caleb Larsen', category: 'JavaScript'})
	}
});
```
excluding certain fields in what the server publishes to the client side cache:

```
Meteor.publish('posts', function() {
	return Posts.find({'author': 'Tom'},
		{fields: {
			date: false
		}});
});
```

## Routing

_iron router_ is a routing package conceived specirically for meteor apps. what it does:

- routing
- filters (assigning actions to url paths)
- manages subscriptions (control which path has access to what data)

in terminal: `meteor add iron:router`

### Router Vocabulary

- routes: set of instructions that tells the app what to do when it enounteers a URL
- paths: url. static `/terms_of_service` or dynamic `/posts/xyz` & even use query params `/search?keyword=meteor`
- segments: different parts of a path, delimited by `/` forward slashes
- hooks: actions you'd like to perform before, after or during the routing process (ex. checking that the user has proper rights before displaying a page)
- filters: hooks that you define globally for one or more routes
- route templates: each route needs to point to a template
- layouts: frame for your content containing all the html code that wraps the current template
- controllers: rather than duplicating code for templates that reuse the same params, you can let these routes inherit from a single _routing controller_ which will contain all the common routing logic

### Routing: Mapping URLs to Templates

the `{{> yield}}` helper will define a special dynamic zone that will automatically render whichever template corresponds to the current route. now, the main div in our `layout.html` file looks like this:

```
<div id="main" class="row-fluid">
	{{ > yield }}
</div>
```

![router diagram](http://i.imgur.com/PDDdaCm.png)

create a `lib/router.js` file, w/in which we will tell the router to use a particular template as the default layout for all routes:

```
Router.configure({
	layoutTemplate: 'layout'
});
```

define a new route named `postsList` and map it to the `/` path:

```
Router.route('/', {name: 'postsList'});
```

the Spacebars helper, `{{pathFor}}`, returns the URL path component of any route. so, instead of `a href="/"`, we use `a href="{{pathFor 'postsList'}}"` so that, even if the route changes, we won't dead any links

### Waiting on Data

in `lib/router.js`, define a loading template and a `waitOn` function, w/in which we will move our subscription to `posts`:

```
Router.configure({
	layoutTemplate: 'layout',
	loadingTemplate: 'loading',
	waitOn: function() {
		Meteor.subscribe('posts');
	}
});
```
good idea to wait on your subscriptions, both for ux but also because it means you can safely assume that data will always be available from within a template, eliminating the need to deal with templates being rendered before their underlying data is available

### Routing to a Single Post

set up single, dynamic route to handle all posts

```
Router.route('/posts/:_id', {name: 'postsPage'})
```

The `:_id` syntax tells the router two things: first, to match any route of the form `/posts/xyz/`, where _“xyz”_ can be anything at all. Second, to put whatever it finds in this _“xyz”_ spot inside an `_id` property in the router's params array.

router let's you specify a template's **data context** <-- what you fill up your template with

we can get the proper data context by looking for our post based on the `_id` we got from the url:

```
Router.route('/posts/:_id', {
	name: 'postsPage',
	data: function() {
		return Posts.findOne(this.params._id);
	}
});
```
w/in the `data` function for a route, `this` corresponds to the currently matched route, and we can use `this.params` to access the named parts of the route (this only works if we prefix them w/ `:` inside our `path`)

via `each` iterators, teh data context is typically automatically set. that said, the data context can be explicitly set, like this:

```
{{> widgetPage myWidget}}
```

here, the `widgetPage` template or partial is being endowed w/ the `myWidget` data context

we'll use a route helper to link a 'discuss' button to our individual post page.

### 404 / Not Found page

create a new `not_found.html` page in `client/templates/application` and reference it in our `router.js` file like this:

```
Router.configure({
  …	
	notFoundTemplate: 'notFound',
  …
});
```

show 'not found' page even if route is ok, but _id is invalid (add to the end of `router.js`):

```
Router.onBeforeAction('dataNotFound', {only: 'postPage'});
```

## The Session

in many cases, you'll need to store some ephemeral state that is only relevant to the current user's version of the application — the Session is a convenient way to do this.

- session is a global reactive data store
- global singleton object — one session, accessible everywhere
- session can be used as central communication bus for different parts of app
- session object not shared between users or browser tabs
- always store user state in either Session or URL
- store any state you want to be shareable between users in the URL

## Adding Users

while meteor does have its own accounts ui package, we're using bs3, so rather than the generic `meteor add accounts-ui`, we'll go w/ the bootstrap flavor:

```
meteor add ian:accounts-ui-bootstrap-3
meteor add accounts-password
```

now, we can drop the accounts ui into our site via the following helper:

```
{{> loginButtons}}
```

we can even control the alignment of the ui by adding the following:

```
{{> loginButtons align="right"}}
```

To tell our accounts system that we want users to log-in via a username, we simply add an `Accounts.ui` config block in a new `config.js` file inside `client/helpers/`:

```
Accounts.ui.config({
  passwordSignupFields: 'USERNAME_ONLY'
});
```
however, this causes you to lose the 'forgot password' flow (so, i don't like it)

***note: we'll want to change this to the google accounts package***

## Creating Our First User

you can get the currently logged in user via:

```
Meteor.user()
```

**fyi:** the accounts package auto-publishes the _current_ user. so, we've always access to the current user, but one user can't see anyone else's account details.

## Reactivity

