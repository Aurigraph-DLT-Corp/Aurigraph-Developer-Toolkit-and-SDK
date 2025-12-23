/**
 * Aurigraph Mobile SDK Charts
 * 
 * Advanced charting components for blockchain data visualization
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Dimensions, Animated, ScrollView } from 'react-native';
import { AurigraphTheme, ThemeManager } from '../themes/aurigraph_themes';

const { width: screenWidth } = Dimensions.get('window');

// Types
export interface ChartDataPoint {
  x: number | string;
  y: number;
  label?: string;
  timestamp?: number;
}

export interface ChartProps {
  data: ChartDataPoint[];
  width?: number;
  height?: number;
  theme?: AurigraphTheme;
  animated?: boolean;
  showGrid?: boolean;
  showLabels?: boolean;
  onDataPointPress?: (point: ChartDataPoint, index: number) => void;
}

// Price Chart Component
export const PriceChart: React.FC<ChartProps> = ({
  data,
  width = screenWidth - 32,
  height = 200,
  theme = ThemeManager.getCurrentTheme(),
  animated = true,
  showGrid = true,
  showLabels = true,
  onDataPointPress,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: theme.animations.duration.slow,
        useNativeDriver: false,
      }).start();
    }
  }, [data]);

  const maxY = Math.max(...data.map(d => d.y));
  const minY = Math.min(...data.map(d => d.y));
  const range = maxY - minY;

  const getX = (index: number) => (width / (data.length - 1)) * index;
  const getY = (value: number) => height - ((value - minY) / range) * height;

  const pathData = data.map((point, index) => {
    const x = getX(index);
    const y = getY(point.y);
    return index === 0 ? `M${x},${y}` : `L${x},${y}`;
  }).join(' ');

  const gradientId = `priceGradient${Math.random()}`;

  return (
    <View style={{ width, height: height + 40 }}>
      <Text style={{
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.onSurface,
        marginBottom: theme.spacing.sm,
      }}>
        Price Chart
      </Text>
      
      <View style={{ position: 'relative' }}>
        {/* SVG would be used here in a real implementation */}
        <View
          style={{
            width,
            height,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {showGrid && (
            <View style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
            }}>
              {/* Grid lines would be rendered here */}
              {Array.from({ length: 5 }).map((_, i) => (
                <View
                  key={i}
                  style={{
                    position: 'absolute',
                    top: (height / 4) * i,
                    left: 0,
                    right: 0,
                    height: 1,
                    backgroundColor: ThemeManager.getColorWithOpacity(
                      theme.colors.onSurface,
                      0.1
                    ),
                  }}
                />
              ))}
            </View>
          )}
          
          {/* Data points */}
          {data.map((point, index) => {
            const x = getX(index);
            const y = getY(point.y);
            
            return (
              <Animated.View
                key={index}
                style={{
                  position: 'absolute',
                  left: x - 3,
                  top: y - 3,
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: theme.colors.chart.primary,
                  opacity: animated ? animatedValue : 1,
                  transform: [{
                    scale: selectedPoint === index ? 1.5 : 1
                  }],
                }}
                onTouchEnd={() => {
                  setSelectedPoint(index);
                  onDataPointPress?.(point, index);
                }}
              />
            );
          })}
          
          {/* Selected point info */}
          {selectedPoint !== null && (
            <View
              style={{
                position: 'absolute',
                top: 10,
                left: 10,
                backgroundColor: theme.colors.background,
                padding: theme.spacing.sm,
                borderRadius: theme.borderRadius.sm,
                shadowColor: '#000',
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 5,
              }}
            >
              <Text style={{
                color: theme.colors.onBackground,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
              }}>
                {data[selectedPoint].label || `Point ${selectedPoint + 1}`}
              </Text>
              <Text style={{
                color: theme.colors.chart.primary,
                fontSize: theme.typography.fontSize.md,
                fontWeight: theme.typography.fontWeight.bold,
              }}>
                ${data[selectedPoint].y.toLocaleString()}
              </Text>
            </View>
          )}
        </View>
        
        {showLabels && (
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: theme.spacing.sm,
          }}>
            <Text style={{
              color: theme.colors.onSurface,
              fontSize: theme.typography.fontSize.xs,
            }}>
              {data[0]?.label || 'Start'}
            </Text>
            <Text style={{
              color: theme.colors.onSurface,
              fontSize: theme.typography.fontSize.xs,
            }}>
              {data[data.length - 1]?.label || 'End'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

// Portfolio Pie Chart
export interface PieChartData {
  label: string;
  value: number;
  color?: string;
}

export interface PieChartProps {
  data: PieChartData[];
  size?: number;
  theme?: AurigraphTheme;
  animated?: boolean;
  showLegend?: boolean;
  onSegmentPress?: (segment: PieChartData, index: number) => void;
}

export const PortfolioPieChart: React.FC<PieChartProps> = ({
  data,
  size = 200,
  theme = ThemeManager.getCurrentTheme(),
  animated = true,
  showLegend = true,
  onSegmentPress,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: theme.animations.duration.slow,
        useNativeDriver: false,
      }).start();
    }
  }, [data]);

  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.onSurface,
        marginBottom: theme.spacing.md,
      }}>
        Portfolio Distribution
      </Text>
      
      <View style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.colors.surface,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {data.map((item, index) => {
          const percentage = item.value / total;
          const startAngle = cumulativePercentage * 2 * Math.PI;
          const endAngle = (cumulativePercentage + percentage) * 2 * Math.PI;
          cumulativePercentage += percentage;

          const color = item.color || theme.colors.chart.gradient[index % theme.colors.chart.gradient.length];

          return (
            <Animated.View
              key={index}
              style={{
                position: 'absolute',
                width: size,
                height: size,
                opacity: animated ? animatedValue : 1,
                transform: [{
                  scale: selectedSegment === index ? 1.05 : 1
                }],
              }}
              onTouchEnd={() => {
                setSelectedSegment(index);
                onSegmentPress?.(item, index);
              }}
            >
              {/* Pie segment would be rendered with SVG in real implementation */}
              <View
                style={{
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  backgroundColor: color,
                  opacity: 0.8,
                }}
              />
            </Animated.View>
          );
        })}
        
        {/* Center hole */}
        <View
          style={{
            position: 'absolute',
            width: size * 0.5,
            height: size * 0.5,
            borderRadius: (size * 0.5) / 2,
            backgroundColor: theme.colors.background,
            top: size * 0.25,
            left: size * 0.25,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{
            color: theme.colors.onBackground,
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.bold,
          }}>
            Total
          </Text>
          <Text style={{
            color: theme.colors.chart.primary,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
          }}>
            ${total.toLocaleString()}
          </Text>
        </View>
      </View>
      
      {showLegend && (
        <View style={{ marginTop: theme.spacing.md, width: '100%' }}>
          {data.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            const color = item.color || theme.colors.chart.gradient[index % theme.colors.chart.gradient.length];
            
            return (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: theme.spacing.sm,
                  paddingHorizontal: theme.spacing.md,
                }}
              >
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: color,
                    marginRight: theme.spacing.sm,
                  }}
                />
                <Text style={{
                  flex: 1,
                  color: theme.colors.onSurface,
                  fontSize: theme.typography.fontSize.sm,
                }}>
                  {item.label}
                </Text>
                <Text style={{
                  color: theme.colors.onSurface,
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                }}>
                  {percentage}%
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

// Transaction Volume Bar Chart
export interface BarChartProps extends ChartProps {
  barColor?: string;
  showValues?: boolean;
}

export const TransactionVolumeChart: React.FC<BarChartProps> = ({
  data,
  width = screenWidth - 32,
  height = 200,
  theme = ThemeManager.getCurrentTheme(),
  animated = true,
  showGrid = true,
  showLabels = true,
  showValues = true,
  barColor,
  onDataPointPress,
}) => {
  const animatedValues = useRef(
    data.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    if (animated) {
      const animations = animatedValues.map((value, index) =>
        Animated.timing(value, {
          toValue: 1,
          duration: theme.animations.duration.normal,
          delay: index * 50,
          useNativeDriver: false,
        })
      );
      
      Animated.stagger(50, animations).start();
    }
  }, [data]);

  const maxY = Math.max(...data.map(d => d.y));
  const barWidth = (width / data.length) * 0.7;
  const barSpacing = (width / data.length) * 0.3;

  return (
    <View style={{ width, height: height + 60 }}>
      <Text style={{
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.onSurface,
        marginBottom: theme.spacing.sm,
      }}>
        Transaction Volume
      </Text>
      
      <View style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        height,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.sm,
      }}>
        {data.map((point, index) => {
          const barHeight = (point.y / maxY) * (height - 20);
          const color = barColor || theme.colors.chart.primary;
          
          return (
            <View
              key={index}
              style={{
                width: barWidth,
                alignItems: 'center',
                marginRight: index < data.length - 1 ? barSpacing : 0,
              }}
              onTouchEnd={() => onDataPointPress?.(point, index)}
            >
              {showValues && (
                <Text style={{
                  color: theme.colors.onSurface,
                  fontSize: theme.typography.fontSize.xs,
                  marginBottom: 4,
                }}>
                  {point.y.toLocaleString()}
                </Text>
              )}
              
              <Animated.View
                style={{
                  width: barWidth,
                  height: animated ? 
                    animatedValues[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, barHeight],
                    }) : barHeight,
                  backgroundColor: color,
                  borderRadius: theme.borderRadius.sm,
                  opacity: 0.8,
                }}
              />
            </View>
          );
        })}
      </View>
      
      {showLabels && (
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: theme.spacing.sm,
          paddingHorizontal: theme.spacing.sm,
        }}>
          {data.map((point, index) => (
            <Text
              key={index}
              style={{
                color: theme.colors.onSurface,
                fontSize: theme.typography.fontSize.xs,
                textAlign: 'center',
                width: barWidth + barSpacing,
              }}
            >
              {point.label || point.x}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

// Network Statistics Gauge
export interface GaugeProps {
  value: number;
  maxValue: number;
  label: string;
  unit?: string;
  size?: number;
  theme?: AurigraphTheme;
  animated?: boolean;
  color?: string;
}

export const NetworkStatsGauge: React.FC<GaugeProps> = ({
  value,
  maxValue,
  label,
  unit = '',
  size = 150,
  theme = ThemeManager.getCurrentTheme(),
  animated = true,
  color,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: value / maxValue,
        duration: theme.animations.duration.slow,
        useNativeDriver: false,
      }).start();
    }
  }, [value]);

  const percentage = (value / maxValue) * 100;
  const gaugeColor = color || theme.colors.chart.primary;

  return (
    <View style={{
      width: size,
      height: size,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <View style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.colors.surface,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Gauge background */}
        <View style={{
          position: 'absolute',
          width: size - 20,
          height: size - 20,
          borderRadius: (size - 20) / 2,
          borderWidth: 10,
          borderColor: ThemeManager.getColorWithOpacity(gaugeColor, 0.2),
        }} />
        
        {/* Gauge progress */}
        <Animated.View style={{
          position: 'absolute',
          width: size - 20,
          height: size - 20,
          borderRadius: (size - 20) / 2,
          borderWidth: 10,
          borderColor: 'transparent',
          borderTopColor: gaugeColor,
          transform: [{
            rotate: animated ?
              animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', `${percentage * 3.6}deg`],
              }) : `${percentage * 3.6}deg`
          }],
        }} />
        
        {/* Center content */}
        <View style={{
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Text style={{
            color: theme.colors.onSurface,
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.bold,
          }}>
            {value.toLocaleString()}
          </Text>
          {unit && (
            <Text style={{
              color: theme.colors.onSurface,
              fontSize: theme.typography.fontSize.sm,
              opacity: 0.7,
            }}>
              {unit}
            </Text>
          )}
        </View>
      </View>
      
      <Text style={{
        color: theme.colors.onSurface,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        marginTop: theme.spacing.sm,
        textAlign: 'center',
      }}>
        {label}
      </Text>
    </View>
  );
};