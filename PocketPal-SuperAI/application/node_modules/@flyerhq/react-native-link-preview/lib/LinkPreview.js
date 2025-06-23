import * as React from 'react';
import { Image, LayoutAnimation, Linking, StyleSheet, Text, TouchableWithoutFeedback, View, } from 'react-native';
import { getPreviewData, oneOf } from './utils';
export const LinkPreview = React.memo(({ containerStyle, enableAnimation, header, metadataContainerStyle, metadataTextContainerStyle, onPreviewDataFetched, previewData, renderDescription, renderHeader, renderImage, renderLinkPreview, renderMinimizedImage, renderText, renderTitle, requestTimeout = 5000, text, textContainerStyle, touchableWithoutFeedbackProps, }) => {
    const [containerWidth, setContainerWidth] = React.useState(0);
    const [data, setData] = React.useState(previewData);
    const aspectRatio = (data === null || data === void 0 ? void 0 : data.image)
        ? data.image.width / data.image.height
        : undefined;
    React.useEffect(() => {
        let isCancelled = false;
        if (previewData) {
            setData(previewData);
            return;
        }
        const fetchData = async () => {
            setData(undefined);
            const newData = await getPreviewData(text, requestTimeout);
            // Set data only if component is still mounted
            /* istanbul ignore next */
            if (!isCancelled) {
                // No need to cover LayoutAnimation
                /* istanbul ignore next */
                if (enableAnimation) {
                    LayoutAnimation.easeInEaseOut();
                }
                setData(newData);
                onPreviewDataFetched === null || onPreviewDataFetched === void 0 ? void 0 : onPreviewDataFetched(newData);
            }
        };
        fetchData();
        return () => {
            isCancelled = true;
        };
    }, [
        enableAnimation,
        onPreviewDataFetched,
        previewData,
        requestTimeout,
        text,
    ]);
    const handleContainerLayout = React.useCallback((event) => {
        setContainerWidth(event.nativeEvent.layout.width);
    }, []);
    const handlePress = () => (data === null || data === void 0 ? void 0 : data.link) && Linking.openURL(data.link);
    const renderDescriptionNode = (description) => {
        return oneOf(renderDescription, React.createElement(Text, { numberOfLines: 3, style: styles.description }, description))(description);
    };
    const renderHeaderNode = () => {
        return header
            ? oneOf(renderHeader, React.createElement(Text, { numberOfLines: 1, style: styles.header }, header))(header)
            : null;
    };
    const renderImageNode = (image) => {
        // aspectRatio shouldn't be undefined, just an additional check
        /* istanbul ignore next */
        const ar = aspectRatio !== null && aspectRatio !== void 0 ? aspectRatio : 1;
        return oneOf(renderImage, React.createElement(Image, { accessibilityRole: 'image', resizeMode: 'contain', source: { uri: image.url }, style: StyleSheet.flatten([
                styles.image,
                ar < 1
                    ? {
                        height: containerWidth,
                        minWidth: 170,
                        width: containerWidth * ar,
                    }
                    : {
                        height: containerWidth / ar,
                        maxHeight: containerWidth,
                        width: containerWidth,
                    },
            ]) }))(image);
    };
    const renderLinkPreviewNode = () => {
        return oneOf(renderLinkPreview, React.createElement(React.Fragment, null,
            React.createElement(View, { style: StyleSheet.flatten([
                    styles.textContainer,
                    textContainerStyle,
                ]) },
                renderHeaderNode(),
                renderTextNode(),
                ((data === null || data === void 0 ? void 0 : data.description) ||
                    ((data === null || data === void 0 ? void 0 : data.image) &&
                        aspectRatio === 1 &&
                        ((data === null || data === void 0 ? void 0 : data.description) || (data === null || data === void 0 ? void 0 : data.title))) ||
                    (data === null || data === void 0 ? void 0 : data.title)) && (React.createElement(View, { style: StyleSheet.flatten([
                        styles.metadataContainer,
                        metadataContainerStyle,
                    ]) },
                    React.createElement(View, { style: StyleSheet.flatten([
                            styles.metadataTextContainer,
                            metadataTextContainerStyle,
                        ]) },
                        (data === null || data === void 0 ? void 0 : data.title) && renderTitleNode(data.title),
                        (data === null || data === void 0 ? void 0 : data.description) && renderDescriptionNode(data.description)),
                    (data === null || data === void 0 ? void 0 : data.image) &&
                        aspectRatio === 1 &&
                        renderMinimizedImageNode(data.image)))),
            (data === null || data === void 0 ? void 0 : data.image) &&
                (aspectRatio !== 1 || (!(data === null || data === void 0 ? void 0 : data.description) && !data.title)) &&
                renderImageNode(data.image)))({
            aspectRatio,
            containerWidth,
            previewData: data,
        });
    };
    const renderMinimizedImageNode = (image) => {
        return oneOf(renderMinimizedImage, React.createElement(Image, { accessibilityRole: 'image', source: { uri: image.url }, style: styles.minimizedImage }))(image);
    };
    const renderTextNode = () => oneOf(renderText, React.createElement(Text, null, text))(text);
    const renderTitleNode = (title) => {
        return oneOf(renderTitle, React.createElement(Text, { numberOfLines: 2, style: styles.title }, title))(title);
    };
    return (React.createElement(TouchableWithoutFeedback, { accessibilityRole: 'button', onPress: handlePress, ...touchableWithoutFeedbackProps },
        React.createElement(View, { onLayout: handleContainerLayout, style: containerStyle }, renderLinkPreviewNode())));
});
const styles = StyleSheet.create({
    description: {
        marginTop: 4,
    },
    header: {
        marginBottom: 6,
    },
    image: {
        alignSelf: 'center',
        backgroundColor: '#f7f7f8',
    },
    metadataContainer: {
        flexDirection: 'row',
        marginTop: 16,
    },
    metadataTextContainer: {
        flex: 1,
    },
    minimizedImage: {
        borderRadius: 12,
        height: 48,
        marginLeft: 4,
        width: 48,
    },
    textContainer: {
        marginHorizontal: 24,
        marginVertical: 16,
    },
    title: {
        fontWeight: 'bold',
    },
});
//# sourceMappingURL=LinkPreview.js.map