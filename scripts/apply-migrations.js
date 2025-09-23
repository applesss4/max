#!/usr/bin/env node

// 脚本用于手动应用数据库迁移
import fs from 'fs';
import path from 'path';

// 读取最新的迁移文件
const migrationDir = path.join(process.cwd(), 'supabase', 'migrations');
const migrationFiles = fs.readdirSync(migrationDir)
  .filter(file => file.endsWith('.sql'))
  .sort();

console.log('最新的数据库迁移文件:');
console.log(migrationFiles[migrationFiles.length - 1]);

// 读取新创建的迁移文件内容
const newMigrationFile = path.join(migrationDir, '020_create_wardrobe_and_outfit_tables.sql');
const newMigrationContent = fs.readFileSync(newMigrationFile, 'utf8');

console.log('\n新迁移文件内容:');
console.log(newMigrationContent);

console.log('\n请手动将以上SQL语句应用到您的Supabase数据库中。');
console.log('您可以通过Supabase控制台的SQL编辑器来执行这些语句。');

// 更新类型定义文件的说明
console.log('\n请确保src/types/supabase.ts文件已更新，包含以下表的类型定义:');
console.log('- wardrobe_items');
console.log('- outfit_history');