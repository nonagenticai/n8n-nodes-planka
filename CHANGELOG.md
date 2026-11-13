# Changelog

All notable changes to the kanban project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-11-27

### Fixed
- Removed hardcoded development URLs from credentials configuration
- Updated user role field from invalid values to correct values (user/admin)
- Fixed list type field values to accept only valid options (normal/template)
- Improved test coverage to 79.11% statement coverage and 86.3% function coverage
- Fixed card movement operations between lists
- Corrected sort operation type field handling

### Changed
- Documentation updated with accurate API coverage statistics (47% - 45/96 endpoints)
- Updated README with comprehensive usage examples
- Improved error messages for validation failures

### Security
- Removed hardcoded API URLs that exposed internal development infrastructure

## [1.0.0] - 2025-01-15

### Added
- Initial release with 22 resources and 93 operations
- Support for Project, Board, List, Card management
- User management with role-based access
- Task and checklist operations
- Comment and attachment functionality
- Label management
- Webhook support for event-driven workflows
- Membership operations (board and card)
- Custom fields and custom field groups
- Notification system integration
- Config and terms acceptance handling
- Base custom field group operations
- Action tracking (board and card actions)
- Project manager operations

### Features
- Dual authentication methods (username/password or access token)
- Comprehensive error handling with user-friendly messages
- File upload support for attachments and avatars
- Automatic terms acceptance flow
- Full CRUD operations for all major resources

### Documentation
- Complete API reference documentation
- Installation guides for npm, manual, and Docker deployment
- Usage examples and workflow patterns
- API coverage analysis (47% of Planka API)
- Network configuration guide for Docker environments
- Troubleshooting section

### Testing
- Integration tests for all major operations
- Unit tests for operation functions
- Coverage reporting configured
- Test credentials and fixtures

## [Unreleased]

### Planned
- Additional API endpoint coverage (targeting remaining 51 endpoints)
- Performance optimization for bulk operations
- Enhanced webhook event filtering
- Board template management operations
- Advanced analytics and reporting endpoints
- Rate limiting and retry logic improvements
