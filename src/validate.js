import fs from 'fs';
import path from 'path';
import YAML from 'yamljs';

try {
  const templateString = fs.readFileSync(
    path.resolve(__dirname, '../template.yml'),
    'utf8'
  );
  const obj = YAML.parse(templateString);
  const password =
    obj.Resources.GetMetrics.Properties.Environment.Variables.PASSWORD;
  if (password === 'none') {
    throw new Error(
      'You have not changed the API gateway password (PASSWORD environment variable) in the template.yml file. If you do not do this, your endpoint will not be secure.'
    );
  } else if (!password) {
    throw new Error(
      'No PASSWORD environment variable supplied in the template.yml file'
    );
  }
} catch (err) {
  console.log('The validate script has encountered an error.');
  console.log((err && err.message) || 'Unknown error');
  process.exit(1);
}
