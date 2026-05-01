import { StyleSheet } from 'react-native';

export const ONBOARDING_COLORS = {
    background: '#FAFAFA',
    primary: '#111827',
    primaryLight: '#374151',
    text: '#111827',
    textLight: '#4B5563',
    textMuted: '#9CA3AF',
    accent: '#1F2937',
    accentLight: '#6B7280',
    calm: '#E5E7EB',
    glow: 'rgba(17, 24, 39, 0.08)',
};

export const ANIMATION_TIMINGS = {
    fast: 300,
    medium: 500,
    slow: 800,
    verySlow: 1200,
};

export const onboardingStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: ONBOARDING_COLORS.background,
        paddingHorizontal: 32,
        paddingTop: 80,
        paddingBottom: 40,
    },
    heroContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    contentContainer: {
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: ONBOARDING_COLORS.text,
        textAlign: 'center',
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 17,
        lineHeight: 26,
        color: ONBOARDING_COLORS.textLight,
        textAlign: 'center',
        marginBottom: 32,
    },
    microcopy: {
        fontSize: 14,
        color: ONBOARDING_COLORS.textMuted,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    primaryButton: {
        flex: 1,
        backgroundColor: ONBOARDING_COLORS.primary,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: ONBOARDING_COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
    secondaryButton: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        color: ONBOARDING_COLORS.textLight,
        fontSize: 16,
        fontWeight: '500',
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: ONBOARDING_COLORS.textMuted,
        opacity: 0.3,
    },
    paginationDotActive: {
        backgroundColor: ONBOARDING_COLORS.primary,
        opacity: 1,
        width: 24,
    },
});
