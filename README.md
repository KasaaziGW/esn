# Emergency Social Network [ESN]
This is the final project dubbed "Emergency Social Network [ESN]" that the whole class is going to contribute to.


# Group 3

## general implementation
1. When registering a citizen, set the `privilege`.
2. When logging in, set the user privilege in the session details as well.
3. When rendering the navigation, show optional navigation links i.e. those dependent on the user privilege

## use case 1 i.e. when the user is an administrator
4.  When user clicks on the `Users` link in the navigation, show the list of registered users/citizens.
5. Click on the username to go a page showing the details of the specified user.
6. While on the profile page, allow to edit the details of the user as desired.
7. After editing, click a button e.g. Save changes that handles the change appropriately. (consideration for middleware)

## use case 2 i.e. when the user is a cordinator
8. When the user clicks on the `Announcements` link in the navigation, take to the page that shows the announcements.
9. IF the user is a `Cordinator`, show an option to post a new announcement.
