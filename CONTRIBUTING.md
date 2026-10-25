# Contributing to RentManager

First off, thank you for considering contributing to RentManager! It's people like you that make RentManager such a great tool for Kenya's rental market.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)

## Code of Conduct

This project and everyone participating in it is governed by our commitment to providing a welcoming and inclusive experience for everyone.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When you are creating a bug report, please include as many details as possible:

* **Use a clear and descriptive title**
* **Describe the exact steps to reproduce the problem**
* **Provide specific examples to demonstrate the steps**
* **Describe the behavior you observed and what you expected**
* **Include screenshots and animated GIFs if possible**
* **Include your environment details** (OS, browser, Node version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

* **A clear and descriptive title**
* **A detailed description of the proposed functionality**
* **Explain why this enhancement would be useful**
* **List any alternative solutions you've considered**

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

## Development Setup

```bash
# 1. Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/rentmanager-frontend.git
cd rentmanager-frontend

# 2. Install dependencies
npm install

# 3. Create a .env file with necessary credentials
cp .env.example .env

# 4. Start the development server
npm start

# 5. Run tests
npm test
```

## Pull Request Process

1. **Update Documentation**: Ensure README.md and relevant docs are updated
2. **Add Tests**: Include tests for new features or bug fixes
3. **Follow Code Style**: Run `npm run lint` and `npm run format`
4. **Write Clear Commits**: Follow the commit message guidelines below
5. **Update Changelog**: Add your changes to CHANGELOG.md
6. **Request Review**: Request review from maintainers

### PR Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective
- [ ] New and existing unit tests pass locally
```

## Coding Standards

### JavaScript/React

```javascript
// ✅ Good
const PropertyCard = ({ property }) => {
  const { title, price, location } = property;
  
  return (
    <div className="property-card">
      <h3>{title}</h3>
      <p>{formatCurrency(price)}</p>
      <span>{location}</span>
    </div>
  );
};

// ❌ Bad
const PropertyCard = (props) => {
  return (
    <div className="property-card">
      <h3>{props.property.title}</h3>
      <p>{props.property.price}</p>
      <span>{props.property.location}</span>
    </div>
  );
};
```

### Component Structure

1. **Imports** - Group by external, internal, styles
2. **Component Definition** - Use functional components with hooks
3. **PropTypes** - Define prop types for all components
4. **Export** - Named or default export at the bottom

```javascript
// 1. Imports
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { formatCurrency } from '@/utils/format';
import './PropertyCard.css';

// 2. Component
const PropertyCard = ({ property, onSelect }) => {
  // Hooks
  const [isSelected, setIsSelected] = useState(false);
  
  // Effects
  useEffect(() => {
    // Effect logic
  }, [dependency]);
  
  // Event handlers
  const handleClick = () => {
    setIsSelected(!isSelected);
    onSelect(property.id);
  };
  
  // Render
  return (
    <div className={`property-card ${isSelected ? 'selected' : ''}`}>
      {/* JSX */}
    </div>
  );
};

// 3. PropTypes
PropertyCard.propTypes = {
  property: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
};

// 4. Export
export default PropertyCard;
```

### CSS/TailwindCSS

- Use Tailwind utility classes where possible
- Create custom components for repeated patterns
- Follow mobile-first responsive design
- Use semantic class names for custom CSS

### File Naming

- **Components**: PascalCase - `PropertyCard.jsx`
- **Utilities**: camelCase - `formatCurrency.js`
- **Constants**: UPPER_SNAKE_CASE - `API_ENDPOINTS.js`
- **Styles**: kebab-case - `property-card.css`

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semi-colons, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples

```bash
feat(auth): add social login with Google OAuth

Implemented Google OAuth integration for faster user onboarding.
Added new GoogleAuthButton component and updated auth flow.

Closes #123
```

```bash
fix(payments): resolve M-Pesa callback timeout issue

Updated webhook endpoint timeout from 30s to 60s to accommodate
M-Pesa's variable response times during peak hours.

Fixes #456
```

## Testing Guidelines

### Unit Tests

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import PropertyCard from './PropertyCard';

describe('PropertyCard', () => {
  const mockProperty = {
    id: '1',
    title: 'Test Property',
    price: 50000,
    location: 'Nairobi',
  };

  it('renders property details correctly', () => {
    render(<PropertyCard property={mockProperty} onSelect={jest.fn()} />);
    
    expect(screen.getByText('Test Property')).toBeInTheDocument();
    expect(screen.getByText('KES 50,000')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const onSelect = jest.fn();
    render(<PropertyCard property={mockProperty} onSelect={onSelect} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith('1');
  });
});
```

### Integration Tests

- Test complete user workflows
- Mock API calls appropriately
- Test error states and edge cases
- Ensure accessibility standards

## Questions?

Feel free to open an issue with your question or contact the maintainers directly.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to RentManager! 🙏
