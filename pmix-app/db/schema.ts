import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
export const profiles=sqliteTable('layout_profiles',{key:text('key').primaryKey(),owner:text('owner').notNull(),name:text('name').notNull(),data:text('data').notNull(),updated:text('updated').notNull()});
export const history=sqliteTable('learning_history',{revision:integer('revision').primaryKey({autoIncrement:true}),owner:text('owner').notNull(),profile:text('profile').notNull(),action:text('action').notNull(),updated:text('updated').notNull()});
export const attempts=sqliteTable('access_attempts',{owner:text('owner').primaryKey(),window:integer('window').notNull(),count:integer('count').notNull()});
export const chats=sqliteTable('chat_history',{id:integer('id').primaryKey({autoIncrement:true}),owner:text('owner').notNull(),requestId:text('request_id').notNull(),question:text('question').notNull(),answer:text('answer').notNull(),sources:text('sources').notNull(),created:text('created').notNull()},t=>[uniqueIndex('chat_owner_request').on(t.owner,t.requestId),index('chat_owner_id').on(t.owner,t.id)]);

export const maxSettings=sqliteTable('max_settings',{owner:text('owner').notNull(),name:text('name').notNull(),value:text('value').notNull(),updated:text('updated').notNull()},t=>[uniqueIndex('max_settings_owner_name').on(t.owner,t.name)]);
export const maxDrafts=sqliteTable('max_drafts',{owner:text('owner').notNull(),id:text('id').notNull(),title:text('title').notNull(),kind:text('kind').notNull(),content:text('content').notNull(),updated:text('updated').notNull()},t=>[uniqueIndex('max_drafts_owner_id').on(t.owner,t.id)]);

export const reportFormats=sqliteTable('report_formats',{owner:text('owner').notNull(),id:text('id').notNull(),data:text('data').notNull(),revision:integer('revision').notNull(),deleted:integer('deleted').notNull().default(0),updated:text('updated').notNull()},t=>[uniqueIndex('report_formats_owner_id').on(t.owner,t.id)]);
