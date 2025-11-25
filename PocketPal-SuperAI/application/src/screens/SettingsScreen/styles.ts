import {StyleSheet} from 'react-native';

import {Theme} from '../../utils/types';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    container: {
      padding: 16,
    },
    scrollViewContent: {
      paddingVertical: 16,
      paddingHorizontal: 16,
    },
    card: {
      marginVertical: 8,
      borderRadius: 12,
      backgroundColor: theme.colors.background,
    },
    settingItemContainer: {
      marginVertical: 16,
    },
    switchContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 8,
    },
    textContainer: {
      flex: 1,
      marginRight: 16,
    },
    labelWithIconContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    settingIcon: {
      marginRight: 8,
    },
    textLabel: {
      color: theme.colors.onSurface,
    },
    textDescription: {
      color: theme.colors.onSurfaceVariant,
      //marginTop: 4,
    },
    divider: {
      marginVertical: 12,
    },
    slider: {
      //marginVertical: 8,
      //height: 40,
    },
    textInput: {
      marginVertical: 8,
    },
    invalidInput: {
      borderColor: theme.colors.error,
      borderWidth: 1,
    },
    errorText: {
      color: theme.colors.error,
      marginTop: 4,
    },
    menuContainer: {
      position: 'relative',
    },
    menuButton: {
      minWidth: 100,
    },
    buttonContent: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
    },
    advancedSettingsButton: {
      marginVertical: 8,
    },
    advancedSettingsContent: {
      marginTop: 8,
    },
    advancedAccordion: {
      height: 55,
      //backgroundColor: theme.colors.surface,
    },
    accordionTitle: {
      fontSize: 14,
      color: theme.colors.secondary,
    },
    menu: {
      width: 170,
    },
    // MCP Styles
    mcpFormContainer: {
      marginTop: 16,
      gap: 12,
    },
    mcpInput: {
      backgroundColor: theme.colors.surface,
    },
    mcpAddButton: {
      marginTop: 8,
    },
    mcpEmptyState: {
      paddingVertical: 24,
      alignItems: 'center',
    },
    mcpEmptyText: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    mcpServerItem: {
      marginTop: 16,
      padding: 12,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    mcpServerInfo: {
      marginBottom: 12,
    },
    mcpServerUrl: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
    },
    mcpStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      gap: 8,
    },
    mcpStatusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    mcpConnectedBadge: {
      backgroundColor: theme.colors.primaryContainer,
    },
    mcpDisconnectedBadge: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    mcpStatusText: {
      fontSize: 11,
      fontWeight: '600',
    },
    mcpConnectedText: {
      color: theme.colors.onPrimaryContainer,
    },
    mcpDisconnectedText: {
      color: theme.colors.onSurfaceVariant,
    },
    mcpToolCount: {
      color: theme.colors.onSurfaceVariant,
    },
    mcpServerActions: {
      flexDirection: 'row',
      gap: 8,
    },
    mcpActionButton: {
      flex: 1,
    },
  });
