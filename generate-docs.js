const fs = require('fs');
const path = require('path');

/**
 * Generate documentation from node definition
 * This script auto-generates API reference documentation
 */
try {
  // Load node definition
  const { Planka } = require('./dist/nodes/Planka/Planka.node');
  const nodeInstance = new Planka();
  const description = nodeInstance.description;

  // Extract operations by resource
  const operationsByResource = {};
  const resources = description.properties.find(p => p.name === 'resource').options;

  resources.forEach(resource => {
    const resourceValue = resource.value;
    const operationProp = description.properties.find(p =>
      p.name === 'operation' &&
      p.displayOptions?.show?.resource?.includes(resourceValue)
    );

    if (operationProp) {
      operationsByResource[resourceValue] = {
        displayName: resource.name,
        description: resource.description,
        operations: operationProp.options.map(op => ({
          name: op.name,
          value: op.value,
          description: op.description,
          action: op.action
        }))
      };
    }
  });

  // Generate JSON reference
  const reference = {
    name: description.displayName,
    version: description.version,
    description: description.description,
    resources: operationsByResource,
    totalResources: Object.keys(operationsByResource).length,
    totalOperations: Object.values(operationsByResource).reduce((sum, r) => sum + r.operations.length, 0)
  };

  // Save JSON reference
  const docsDir = path.join(__dirname, 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(docsDir, 'node-reference.json'),
    JSON.stringify(reference, null, 2)
  );

  // Generate Markdown documentation
  const markdown = generateMarkdown(reference);
  fs.writeFileSync(
    path.join(docsDir, 'node-reference.md'),
    markdown
  );

  console.log('✓ Documentation generated successfully');
  console.log(`  - ${reference.totalResources} resources`);
  console.log(`  - ${reference.totalOperations} operations`);
} catch (error) {
  console.error('Error generating documentation:', error.message);
  console.log('Note: Run "npm run build" first if dist/ folder is missing');
  process.exit(0); // Don't fail the build
}

function generateMarkdown(reference) {
  let md = `# ${reference.name} Node Reference\n\n`;
  md += `**Version:** ${reference.version}\n`;
  md += `**Description:** ${reference.description}\n\n`;
  md += `---\n\n`;
  md += `## Summary\n\n`;
  md += `- **Total Resources:** ${reference.totalResources}\n`;
  md += `- **Total Operations:** ${reference.totalOperations}\n\n`;
  md += `---\n\n`;
  md += `## Resources\n\n`;

  Object.entries(reference.resources).forEach(([resourceValue, resource]) => {
    md += `### ${resource.displayName}\n\n`;
    md += `${resource.description}\n\n`;
    md += `**Operations:**\n\n`;

    resource.operations.forEach(op => {
      md += `- **${op.name}** (\`${op.value}\`): ${op.description}\n`;
    });

    md += `\n`;
  });

  md += `---\n\n`;
  md += `**Generated:** ${new Date().toISOString()}\n`;

  return md;
}
