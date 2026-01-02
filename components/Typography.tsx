import React, { ReactNode } from 'react';
import { StyleSheet, Text, TextProps, TextStyle } from 'react-native';
import { Colors, Typography as TypographyConstants } from '../constants';

interface BaseTypographyProps extends TextProps {
  children: ReactNode;
  style?: TextStyle;
  color?: string;
}

interface TitleProps extends BaseTypographyProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
}

interface SubtitleProps extends BaseTypographyProps {
  size?: 'small' | 'medium' | 'large';
}

interface BodyProps extends BaseTypographyProps {
  size?: 'small' | 'medium' | 'large';
  weight?: 'normal' | 'medium' | 'bold';
}

interface CaptionProps extends BaseTypographyProps {
  size?: 'small' | 'medium';
}

const sizeMap = {
  small: TypographyConstants.fontSize.sm,
  medium: TypographyConstants.fontSize.md,
  large: TypographyConstants.fontSize.lg,
  xlarge: TypographyConstants.fontSize.xl,
  xxlarge: TypographyConstants.fontSize.xxl,
};

export const Title = React.memo<TitleProps>(
  ({ children, style, color = Colors.textPrimary, size = 'large', ...props }) => {
    const fontSize = size === 'small' 
      ? TypographyConstants.fontSize.xxl 
      : size === 'medium'
      ? TypographyConstants.fontSize.xxxl
      : size === 'large'
      ? TypographyConstants.fontSize.xxxxl
      : TypographyConstants.fontSize.huge;

    return (
      <Text
        style={[
          styles.title,
          {
            fontFamily: TypographyConstants.fontFamily.primary,
            fontSize,
            color,
          },
          style,
        ]}
        {...props}
      >
        {children}
      </Text>
    );
  }
);

Title.displayName = 'Title';

export const Subtitle = React.memo<SubtitleProps>(
  ({ children, style, color = Colors.textSecondary, size = 'medium', ...props }) => {
    const fontSize = size === 'small'
      ? TypographyConstants.fontSize.sm
      : size === 'medium'
      ? TypographyConstants.fontSize.lg
      : TypographyConstants.fontSize.xl;

    return (
      <Text
        style={[
          styles.subtitle,
          {
            fontFamily: TypographyConstants.fontFamily.secondary,
            fontSize,
            color,
          },
          style,
        ]}
        {...props}
      >
        {children}
      </Text>
    );
  }
);

Subtitle.displayName = 'Subtitle';

export const Body = React.memo<BodyProps>(
  ({
    children,
    style,
    color = Colors.textPrimary,
    size = 'medium',
    weight = 'normal',
    ...props
  }) => {
    const fontSize = size === 'small'
      ? TypographyConstants.fontSize.sm
      : size === 'medium'
      ? TypographyConstants.fontSize.md
      : TypographyConstants.fontSize.lg;

    const fontWeight = weight === 'normal'
      ? TypographyConstants.fontWeight.normal
      : weight === 'medium'
      ? TypographyConstants.fontWeight.medium
      : TypographyConstants.fontWeight.bold;

    return (
      <Text
        style={[
          styles.body,
          {
            fontFamily: TypographyConstants.fontFamily.secondary,
            fontSize,
            color,
            fontWeight,
          },
          style,
        ]}
        {...props}
      >
        {children}
      </Text>
    );
  }
);

Body.displayName = 'Body';

export const Caption = React.memo<CaptionProps>(
  ({ children, style, color = Colors.textTertiary, size = 'medium', ...props }) => {
    const fontSize = size === 'small'
      ? TypographyConstants.fontSize.xs
      : TypographyConstants.fontSize.sm;

    return (
      <Text
        style={[
          styles.caption,
          {
            fontFamily: TypographyConstants.fontFamily.secondary,
            fontSize,
            color,
          },
          style,
        ]}
        {...props}
      >
        {children}
      </Text>
    );
  }
);

Caption.displayName = 'Caption';

const styles = StyleSheet.create({
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  body: {},
  caption: {},
});


