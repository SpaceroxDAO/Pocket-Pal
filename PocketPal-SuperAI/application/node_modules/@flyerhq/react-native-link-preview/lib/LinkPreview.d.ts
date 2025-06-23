import * as React from 'react';
import { StyleProp, TouchableWithoutFeedbackProps, ViewStyle } from 'react-native';
import { PreviewData, PreviewDataImage } from './types';
export interface LinkPreviewProps {
    containerStyle?: StyleProp<ViewStyle>;
    enableAnimation?: boolean;
    header?: string;
    metadataContainerStyle?: StyleProp<ViewStyle>;
    metadataTextContainerStyle?: StyleProp<ViewStyle>;
    onPreviewDataFetched?: (previewData: PreviewData) => void;
    previewData?: PreviewData;
    renderDescription?: (description: string) => React.ReactNode;
    renderHeader?: (header: string) => React.ReactNode;
    renderImage?: (image: PreviewDataImage) => React.ReactNode;
    renderLinkPreview?: (payload: {
        aspectRatio?: number;
        containerWidth: number;
        previewData?: PreviewData;
    }) => React.ReactNode;
    renderMinimizedImage?: (image: PreviewDataImage) => React.ReactNode;
    renderText?: (text: string) => React.ReactNode;
    renderTitle?: (title: string) => React.ReactNode;
    requestTimeout?: number;
    text: string;
    textContainerStyle?: StyleProp<ViewStyle>;
    touchableWithoutFeedbackProps?: TouchableWithoutFeedbackProps;
}
export declare const LinkPreview: React.MemoExoticComponent<({ containerStyle, enableAnimation, header, metadataContainerStyle, metadataTextContainerStyle, onPreviewDataFetched, previewData, renderDescription, renderHeader, renderImage, renderLinkPreview, renderMinimizedImage, renderText, renderTitle, requestTimeout, text, textContainerStyle, touchableWithoutFeedbackProps, }: LinkPreviewProps) => JSX.Element>;
