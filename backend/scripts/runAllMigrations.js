// backend/scripts/runAllMigrations.js
const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 STARTING COMPLETE USER MIGRATION PROCESS\n');

const scripts = [
  {
    name: 'User Schema Migration',
    script: 'migrateUserSchema.js',
    description: 'Fixes missing fields (socialLinks, settings, active, etc.)'
  },
  {
    name: 'Timestamp Migration', 
    script: 'migrateTimestamps.js',
    description: 'Migrates lastActive to lastLogin'
  },
  {
    name: 'User Role Validation',
    script: 'fixUserRoles.js', 
    description: 'Ensures valid user roles'
  },
  {
    name: 'Final Validation',
    script: 'validateUsers.js',
    description: 'Validates all users are consistent'
  }
];

async function runMigrations() {
  try {
    for (let i = 0; i < scripts.length; i++) {
      const { name, script, description } = scripts[i];
      
      console.log(`${'='.repeat(60)}`);
      console.log(`📝 STEP ${i + 1}/${scripts.length}: ${name}`);
      console.log(`Description: ${description}`);
      console.log(`${'='.repeat(60)}\n`);

      const scriptPath = path.join(__dirname, script);
      
      try {
        // Check if script file exists
        require.resolve(scriptPath);
        
        console.log(`Running: node ${script}\n`);
        
        // Execute the script
        execSync(`node ${scriptPath}`, { 
          stdio: 'inherit',
          cwd: __dirname 
        });
        
        console.log(`\n✅ ${name} completed successfully!\n`);
        
        // Wait a moment between scripts
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
          console.log(`⚠️  Script ${script} not found, skipping...\n`);
          continue;
        }
        
        console.error(`❌ Error in ${name}:`, error.message);
        
        // Ask if user wants to continue
        const readline = require('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        const answer = await new Promise(resolve => {
          rl.question('Do you want to continue with the next migration? (y/n): ', resolve);
        });
        
        rl.close();
        
        if (answer.toLowerCase() !== 'y') {
          console.log('Migration process stopped by user.');
          process.exit(1);
        }
      }
    }

    console.log(`${'='.repeat(60)}`);
    console.log('🎉 ALL MIGRATIONS COMPLETED SUCCESSFULLY!');
    console.log(`${'='.repeat(60)}\n`);
    
    console.log('✅ Your user data should now be consistent across all users.');
    console.log('📊 Check the validation report above for final status.');
    console.log('\n💡 TIP: You can run individual scripts if needed:');
    scripts.forEach(({ script, description }) => {
      console.log(`   node backend/scripts/${script}  # ${description}`);
    });

  } catch (error) {
    console.error('❌ Migration process failed:', error.message);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('🔧 User Migration Master Script\n');
  console.log('Usage: node runAllMigrations.js [options]\n');
  console.log('Options:');
  console.log('  --help, -h     Show this help message');
  console.log('  --dry-run      Show what would be executed (not implemented yet)');
  console.log('\nThis script will run all user-related migrations in the correct order:');
  scripts.forEach((script, i) => {
    console.log(`  ${i + 1}. ${script.name} - ${script.description}`);
  });
  console.log('\nMake sure you have:');
  console.log('  - A backup of your database');
  console.log('  - The correct MONGO_URI in your .env file');
  console.log('  - Node.js dependencies installed');
  process.exit(0);
}

// Confirmation before running
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('⚠️  IMPORTANT: This will modify your user data in MongoDB.');
console.log('Make sure you have a backup of your database before proceeding.\n');

rl.question('Are you sure you want to run all migrations? (yes/no): ', (answer) => {
  rl.close();
  
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    runMigrations();
  } else {
    console.log('Migration cancelled by user.');
    process.exit(0);
  }
});