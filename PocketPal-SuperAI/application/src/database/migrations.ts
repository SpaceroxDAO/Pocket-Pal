import {
  schemaMigrations,
  addColumns,
} from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    // Initial migration is handled by the schema
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: 'chat_sessions',
          columns: [
            {name: 'active_mcp_server_id', type: 'string', isOptional: true},
            {name: 'enabled_tool_names', type: 'string', isOptional: true},
          ],
        }),
      ],
    },
  ],
});
