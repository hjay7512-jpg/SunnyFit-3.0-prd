import { integer, sqliteTable, text, index } from 'drizzle-orm/sqlite-core';

export const copyBlocks=sqliteTable('copy_blocks',{
  id:text('id').primaryKey(),revision:integer('revision').notNull().default(0),
  values:text('values_json').notNull().default('{}'),updatedAt:text('updated_at'),operationId:text('operation_id')
});
export const copyVersions=sqliteTable('copy_versions',{
  id:text('id').primaryKey(),blockId:text('block_id').notNull(),revision:integer('revision').notNull(),
  before:text('before_json').notNull(),after:text('after_json').notNull(),actor:text('actor').notNull(),
  capabilityId:text('capability_id').notNull(),context:text('context_json').notNull(),createdAt:text('created_at').notNull()
},table=>[index('versions_block_revision').on(table.blockId,table.revision)]);
export const capabilities=sqliteTable('capabilities',{
  id:text('id').primaryKey(),tokenHash:text('token_hash').notNull().unique(),label:text('label').notNull(),
  role:text('role').notNull(),scopes:text('scopes_json').notNull(),createdAt:text('created_at').notNull(),
  expiresAt:text('expires_at').notNull(),revokedAt:text('revoked_at')
});
export const comments=sqliteTable('comments',{
  id:text('id').primaryKey(),blockId:text('block_id').notNull(),body:text('body').notNull(),actor:text('actor').notNull(),
  capabilityId:text('capability_id').notNull(),context:text('context_json').notNull(),createdAt:text('created_at').notNull(),
  resolvedAt:text('resolved_at'),resolvedBy:text('resolved_by')
},table=>[index('comments_block_time').on(table.blockId,table.createdAt)]);
export const commentLimits=sqliteTable('comment_limits',{
  window:text('window').primaryKey(),count:integer('count').notNull()
});
