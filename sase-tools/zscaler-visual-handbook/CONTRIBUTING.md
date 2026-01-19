# Contributing to Zscaler Visual Handbook

Thank you for your interest in contributing! This handbook thrives on real-world experience and community knowledge.

---

## 🎯 Content Philosophy

### What We Value

- **Operational Reality**: Real troubleshooting scenarios over textbook theory
- **Clarity**: Clear explanations that an L2 engineer can understand, with depth for L3/architects
- **Accuracy**: Technically correct information with proper Zscaler terminology
- **Practicality**: CLI commands, log examples, and actionable steps
- **Maintainability**: Well-structured content that's easy to update

### What We Avoid

- Marketing language or sales pitches
- Outdated configuration examples
- Overly simplified "hello world" content
- Unverified troubleshooting steps
- Framework dependencies or build complexity

---

## 🔧 How to Contribute

### Types of Contributions

| Type | Examples |
|------|----------|
| **New Topics** | ZPA connector scaling, Certificate pinning, Browser isolation |
| **Incident Scenarios** | Real P1/P2 cases (anonymized), Root cause analyses |
| **CLI Examples** | Debug commands, Log parsing, API calls |
| **Diagrams** | ASCII art, Architecture flows |
| **Corrections** | Technical errors, Broken links, Typos |
| **Enhancements** | UI improvements, Accessibility, Performance |

---

## 📝 Adding New Content

### Step 1: Create Data File

Navigate to the appropriate `data/` subfolder and create a JSON file:

```json
{
  "topic": "your-topic-name",
  "title": "Your Topic Title",
  "category": "zia|zpa|tunnels|incidents",
  "difficulty": "beginner|intermediate|advanced",
  "lastUpdated": "2025-01-19",
  "sections": [
    {
      "id": "overview",
      "title": "Overview",
      "content": "Your content here...",
      "type": "text|diagram|cli|troubleshooting"
    },
    {
      "id": "diagram",
      "title": "Architecture Flow",
      "content": "ASCII diagram here...",
      "type": "diagram"
    },
    {
      "id": "cli-example",
      "title": "Troubleshooting Commands",
      "commands": [
        {
          "command": "curl -I https://example.com",
          "description": "Check connectivity through ZIA",
          "output": "HTTP/1.1 200 OK\nX-Zscaler-Proxy: ZIA-cloud-name..."
        }
      ],
      "type": "cli"
    },
    {
      "id": "troubleshooting",
      "title": "Common Issues",
      "scenarios": [
        {
          "symptom": "Users cannot access application",
          "possibleCauses": ["App segment misconfigured", "Connector offline"],
          "diagnosticSteps": [
            "Check connector status in ZPA portal",
            "Verify app segment configuration",
            "Review access policy"
          ],
          "resolution": "Step-by-step fix..."
        }
      ],
      "type": "troubleshooting"
    }
  ],
  "interviewQuestions": [
    {
      "question": "What is the difference between ZIA and ZPA?",
      "answer": "ZIA (Internet Access) proxies user traffic to the internet...",
      "difficulty": "beginner"
    }
  ],
  "relatedTopics": ["topic-id-1", "topic-id-2"],
  "references": [
    {
      "title": "Zscaler Help: Topic Name",
      "url": "https://help.zscaler.com/..."
    }
  ]
}
```

### Step 2: Create HTML Page

Copy `templates/topic-template.html` to `sections/your-topic.html`:

```bash
cp templates/topic-template.html sections/your-topic.html
```

Update the data source reference:

```html
<script>
  const topicDataFile = '../data/your-category/your-topic.json';
</script>
```

### Step 3: Update Navigation

Add your topic to `data/navigation.json`:

```json
{
  "menuItems": [
    {
      "id": "your-topic",
      "label": "Your Topic",
      "category": "ZIA|ZPA|Tunnels|Incidents|Advanced",
      "path": "sections/your-topic.html",
      "icon": "icon-name",
      "priority": 10
    }
  ]
}
```

Navigation will auto-update on the next page load.

### Step 4: Test Locally

```bash
# Serve locally
python -m http.server 8000

# Open browser
http://localhost:8000

# Verify:
# - Navigation menu shows new topic
# - Content renders correctly
# - CLI commands work in simulator
# - No console errors
```

---

## 🎨 Content Standards

### Writing Style

**DO:**
- Use active voice: "The connector establishes..." not "The connection is established..."
- Write for your fellow engineer, not for management
- Include real log snippets and error messages
- Provide context: "In a 10,000 user deployment..." instead of "In large deployments..."
- Use CLI-style formatting for commands and outputs

**DON'T:**
- Use vague terms: "simply", "just", "easily"
- Assume knowledge without linking to prerequisites
- Copy-paste from official docs without adding operational insight
- Include sensitive information (IP addresses, company names, credentials)

### Technical Accuracy

All content must be:
- Tested in a real environment (or clearly marked as theoretical)
- Up-to-date with current Zscaler terminology
- Technically reviewable by L3 engineers
- Including version/date context where relevant

Example:
```
As of Zscaler Client Connector 4.2 (Jan 2025), the following behavior applies...
```

### ASCII Diagram Standards

Use monospace-friendly characters:

```
┌─────────────────┐
│   User Device   │
└────────┬────────┘
         │ HTTPS (443)
         ▼
┌─────────────────┐       ┌──────────────┐
│  Zscaler Cloud  │◄─────►│  Internet    │
│  (ZIA Proxy)    │       │  Resources   │
└─────────────────┘       └──────────────┘
         │
         │ Policy Enforcement
         │ - URL Filtering
         │ - SSL Inspection
         │ - DLP Scanning
         ▼
   [Allow/Block/Isolate]
```

### CLI Command Format

```json
{
  "command": "dig +short gateway.zscaler.net",
  "description": "Resolve Zscaler cloud gateway IP addresses",
  "expectedOutput": "165.225.x.x\n165.225.y.y",
  "troubleshooting": "If no IPs return, check DNS resolution and firewall rules"
}
```

---

## 🐛 Reporting Issues

### Bug Reports

Use the **Bug Report** template and include:

- **Page/Section**: Where did you encounter the issue?
- **Browser**: Chrome 120, Firefox 121, Safari 17, etc.
- **Expected Behavior**: What should happen?
- **Actual Behavior**: What actually happened?
- **Steps to Reproduce**: Numbered steps
- **Screenshots**: If applicable
- **Console Errors**: Browser console output

### Content Corrections

Use the **Content Error** template and include:

- **Section**: Which topic/page?
- **Issue**: What's incorrect?
- **Source**: Link to official documentation or reference
- **Suggested Fix**: Proposed correction

---

## 🔄 Pull Request Process

### Before Submitting

- [ ] Content follows the JSON schema
- [ ] HTML validates (no broken tags)
- [ ] CSS doesn't break existing themes
- [ ] JavaScript has no console errors
- [ ] Tested in Chrome, Firefox, Safari
- [ ] No hardcoded paths (use relative paths)
- [ ] No external dependencies added
- [ ] Diagrams render correctly in monospace
- [ ] Links work and point to correct resources

### PR Guidelines

1. **One Topic Per PR**: Don't combine unrelated changes
2. **Descriptive Title**: "Add ZPA connector scaling guide" not "Update content"
3. **Detailed Description**: 
   - What does this PR add/fix?
   - Why is it needed?
   - What testing was done?
4. **Link Issues**: Reference related issues with `#issue-number`
5. **Request Review**: Tag relevant maintainers

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] New topic/section
- [ ] Bug fix
- [ ] Content correction
- [ ] Enhancement
- [ ] Documentation

## Testing
- [ ] Tested locally
- [ ] Validated in Chrome
- [ ] Validated in Firefox
- [ ] No console errors
- [ ] Navigation works
- [ ] CLI simulator works (if applicable)

## Checklist
- [ ] Follows content standards
- [ ] JSON schema valid
- [ ] ASCII diagrams render correctly
- [ ] No sensitive information included
- [ ] Related topics linked

## Screenshots (if applicable)
```

---

## 👥 Code of Conduct

### Our Standards

- **Respectful**: Professional technical discussions
- **Collaborative**: Help each other improve content
- **Constructive**: Criticism should include suggestions
- **Inclusive**: Welcome engineers at all skill levels
- **Focused**: Stay on-topic (Zscaler, networking, security)

### Unacceptable Behavior

- Personal attacks or insults
- Trolling or inflammatory comments
- Publishing others' private information
- Spam or self-promotion
- Off-topic discussions

---

## 🏆 Recognition

Contributors are recognized in:
- Git commit history (permanent record)
- GitHub contributors page
- Annual contributor acknowledgment (CONTRIBUTORS.md)

Significant contributions may be highlighted in release notes.

---

## 📚 Resources for Contributors

### Zscaler Official
- [Help Documentation](https://help.zscaler.com/)
- [Community Forums](https://community.zscaler.com/)
- [API Documentation](https://help.zscaler.com/zia/api)

### Development
- [HTML5 Spec](https://html.spec.whatwg.org/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [JSON Schema](https://json-schema.org/)

### Tools
- [JSON Formatter](https://jsonformatter.org/)
- [ASCII Art Generator](https://patorjk.com/software/taag/)
- [Markdown Guide](https://www.markdownguide.org/)

---

## ❓ Questions?

- **General Questions**: [GitHub Discussions](https://github.com/your-username/zscaler-visual-handbook/discussions)
- **Contribution Help**: Tag `@maintainer` in discussions
- **Security Issues**: Email (don't post publicly)

---

Thank you for helping make this handbook better! 🙌