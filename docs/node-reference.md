# Planka Node Reference

**Version:** 1
**Description:** Interact with Planka Kanban Board API

---

## Summary

- **Total Resources:** 22
- **Total Operations:** 99

---

## Resources

### Project

Operations on projects

**Operations:**

- **Create** (`create`): Create a new project
- **Get** (`get`): Get a project
- **List** (`list`): List all accessible projects
- **Update** (`update`): Update a project
- **Delete** (`delete`): Delete a project
- **Upload Background Image** (`uploadBackgroundImage`): Upload a background image for a project
- **Delete Background Image** (`deleteBackgroundImage`): Delete a background image

### Board

Operations on boards

**Operations:**

- **Create** (`create`): Create a new board
- **Get** (`get`): Get a board
- **Update** (`update`): Update a board
- **Delete** (`delete`): Delete a board

### List

Operations on lists

**Operations:**

- **Create** (`create`): Create a new list
- **Get** (`get`): Get a list
- **Get by Name** (`getByName`): Get the one list on a board with this name (trimmed, case-insensitive by default); typed error when absent or ambiguous
- **Update** (`update`): Update a list
- **Delete** (`delete`): Delete a list
- **Move Cards** (`moveCards`): Move cards to this list
- **Sort** (`sort`): Sort cards in list
- **Clear** (`clear`): Clear all cards from list (trash lists only)

### Card

Operations on cards

**Operations:**

- **Create** (`create`): Create a new card
- **Get** (`get`): Get a card
- **Get Ancestor Chain** (`getAncestorChain`): Walk Relations.parent_card upward and resolve the first ancestor Metadata.project_id; every refusal is a named stop
- **Update** (`update`): Update a card
- **Delete** (`delete`): Delete a card
- **Duplicate** (`duplicate`): Duplicate a card
- **Read Notifications** (`readNotifications`): Mark card notifications as read
- **List In List** (`listInList`): List cards in a specific list with filtering

### User

Operations on users

**Operations:**

- **Create** (`create`): Create a new user
- **Get** (`get`): Get a user
- **List** (`list`): List all users
- **Update** (`update`): Update a user
- **Delete** (`delete`): Delete a user
- **Update Avatar** (`updateAvatar`): Update user avatar
- **Update Email** (`updateEmail`): Update user email
- **Update Password** (`updatePassword`): Update user password
- **Update Username** (`updateUsername`): Update user username
- **Create API Key** (`createApiKey`): Generate API key for a user (returned once only)

### Task

Operations on tasks

**Operations:**

- **Create** (`create`): Create a new task
- **Update** (`update`): Update a task
- **Delete** (`delete`): Delete a task
- **List** (`list`): List tasks in a task list

### Task List

Operations on task lists

**Operations:**

- **Create** (`create`): Create a new task list
- **Get** (`get`): Get a task list
- **Update** (`update`): Update a task list
- **Delete** (`delete`): Delete a task list

### Comment

Operations on comments

**Operations:**

- **Create** (`create`): Create a new comment
- **Update** (`update`): Update a comment
- **Delete** (`delete`): Delete a comment
- **List** (`list`): List comments on a card

### Attachment

Operations on attachments

**Operations:**

- **Create** (`create`): Upload an attachment
- **Update** (`update`): Update an attachment name
- **Delete** (`delete`): Delete an attachment

### Label

Operations on labels

**Operations:**

- **Create** (`create`): Create a new label
- **Update** (`update`): Update a label
- **Delete** (`delete`): Delete a label
- **Add To Card** (`addToCard`): Add label to card
- **Remove From Card** (`removeFromCard`): Remove label from card

### Webhook

Operations on webhooks

**Operations:**

- **Create** (`create`): Create a new webhook
- **List** (`list`): List webhooks
- **Update** (`update`): Update a webhook
- **Delete** (`delete`): Delete a webhook

### Membership

Operations on memberships (card and board)

**Operations:**

- **Add User To Card** (`addUserToCard`): Add user to card
- **Remove User From Card** (`removeUserFromCard`): Remove user from card
- **Add User To Board** (`addUserToBoard`): Add user to board
- **Update Board Membership** (`updateBoardMembership`): Update board membership role
- **Remove User From Board** (`removeUserFromBoard`): Remove user from board

### Config

Operations on application configuration

**Operations:**

- **Get** (`get`): Get application configuration
- **Get Bootstrap** (`getBootstrap`): Get application bootstrap data
- **Test SMTP** (`testSmtp`): Test SMTP configuration by sending test email (Admin only)
- **Update** (`update`): Update application configuration (Admin only)

### Terms

Operations on terms and conditions

**Operations:**

- **Get** (`get`): Get terms and conditions

### Notification

Operations on notifications

**Operations:**

- **List** (`list`): List all unread notifications for the current user
- **Get** (`get`): Get a specific notification
- **Update** (`update`): Update a notification (mark as read/unread)
- **Mark All Read** (`markAllRead`): Mark all notifications as read

### Notification Service

Operations on notification services

**Operations:**

- **Create Board Service** (`createBoard`): Create a notification service for a board
- **Create User Service** (`createUser`): Create a notification service for a user
- **Update** (`update`): Update a notification service
- **Delete** (`delete`): Delete a notification service
- **Test** (`test`): Test a notification service

### Custom Field Group

Operations on custom field groups

**Operations:**

- **Create Board Group** (`createBoardGroup`): Create a custom field group within a board
- **Create Card Group** (`createCardGroup`): Create a custom field group for a card
- **Get** (`get`): Get a custom field group
- **Update** (`update`): Update a custom field group
- **Delete** (`delete`): Delete a custom field group

### Custom Field

Operations on custom fields

**Operations:**

- **Create In Base Group** (`createInBaseGroup`): Create a custom field in a base custom field group
- **Create In Group** (`createInGroup`): Create a custom field in a custom field group
- **Update** (`update`): Update a custom field
- **Delete** (`delete`): Delete a custom field
- **List In Base Group** (`listInBaseGroup`): List custom fields in a base custom field group

### Custom Field Value

Operations on custom field values

**Operations:**

- **Set Value** (`set`): Set or update a custom field value for a card
- **Delete Value** (`delete`): Delete a custom field value from a card

### Base Custom Field Group

Operations on base custom field groups (templates)

**Operations:**

- **Create** (`create`): Create a base custom field group
- **Update** (`update`): Update a base custom field group
- **Delete** (`delete`): Delete a base custom field group

### Action

Operations on actions (activity history)

**Operations:**

- **Get Board Actions** (`getBoardActions`): Get activity history for a board
- **Get Card Actions** (`getCardActions`): Get activity history for a card

### Project Manager

Operations on project managers

**Operations:**

- **Add** (`add`): Add a project manager to a project
- **Remove** (`remove`): Remove a project manager from a project

---

**Generated:** 2026-11-13T05:10:40.682Z
