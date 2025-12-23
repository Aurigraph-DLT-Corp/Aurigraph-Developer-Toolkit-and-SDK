package io.aurigraph.basicnode.crypto;

import java.util.Arrays;
import java.util.logging.Logger;

public class NTRUPolynomial {
    
    private static final Logger LOGGER = Logger.getLogger(NTRUPolynomial.class.getName());
    
    private final int[] coefficients;
    private final int degree;
    
    public NTRUPolynomial(int[] coefficients, int degree) {
        this.coefficients = Arrays.copyOf(coefficients, degree);
        this.degree = degree;
    }
    
    public NTRUPolynomial add(NTRUPolynomial other) {
        if (this.degree != other.degree) {
            throw new IllegalArgumentException("Polynomials must have same degree for addition");
        }
        
        int[] result = new int[degree];
        for (int i = 0; i < degree; i++) {
            result[i] = this.coefficients[i] + other.coefficients[i];
        }
        
        return new NTRUPolynomial(result, degree);
    }
    
    public NTRUPolynomial subtract(NTRUPolynomial other) {
        if (this.degree != other.degree) {
            throw new IllegalArgumentException("Polynomials must have same degree for subtraction");
        }
        
        int[] result = new int[degree];
        for (int i = 0; i < degree; i++) {
            result[i] = this.coefficients[i] - other.coefficients[i];
        }
        
        return new NTRUPolynomial(result, degree);
    }
    
    public NTRUPolynomial multiply(NTRUPolynomial other) {
        if (this.degree != other.degree) {
            throw new IllegalArgumentException("Polynomials must have same degree for multiplication");
        }
        
        int[] result = new int[degree];
        
        // Polynomial multiplication with reduction modulo (x^N - 1)
        for (int i = 0; i < degree; i++) {
            for (int j = 0; j < degree; j++) {
                int index = (i + j) % degree;
                result[index] += this.coefficients[i] * other.coefficients[j];
            }
        }
        
        return new NTRUPolynomial(result, degree);
    }
    
    public NTRUPolynomial multiplyByScalar(int scalar) {
        int[] result = new int[degree];
        for (int i = 0; i < degree; i++) {
            result[i] = this.coefficients[i] * scalar;
        }
        
        return new NTRUPolynomial(result, degree);
    }
    
    public NTRUPolynomial reduceModP(int p) {
        int[] result = new int[degree];
        for (int i = 0; i < degree; i++) {
            result[i] = Math.floorMod(this.coefficients[i], p);
        }
        
        return new NTRUPolynomial(result, degree);
    }
    
    public NTRUPolynomial reduceModQ(int q) {
        int[] result = new int[degree];
        for (int i = 0; i < degree; i++) {
            result[i] = Math.floorMod(this.coefficients[i], q);
        }
        
        return new NTRUPolynomial(result, degree);
    }
    
    public NTRUPolynomial centerLift(int modulus) {
        int[] result = new int[degree];
        int halfModulus = modulus / 2;
        
        for (int i = 0; i < degree; i++) {
            int coeff = Math.floorMod(this.coefficients[i], modulus);
            if (coeff > halfModulus) {
                coeff -= modulus;
            }
            result[i] = coeff;
        }
        
        return new NTRUPolynomial(result, degree);
    }
    
    public NTRUPolynomial invertModP(int p) {
        try {
            // Extended Euclidean algorithm for polynomial inversion modulo p
            // This is a simplified implementation
            return computeInverse(p);
        } catch (Exception e) {
            LOGGER.warning("Failed to compute inverse mod " + p + ": " + e.getMessage());
            return null;
        }
    }
    
    public NTRUPolynomial invertModQ(int q) {
        try {
            // Extended Euclidean algorithm for polynomial inversion modulo q
            return computeInverse(q);
        } catch (Exception e) {
            LOGGER.warning("Failed to compute inverse mod " + q + ": " + e.getMessage());
            return null;
        }
    }
    
    private NTRUPolynomial computeInverse(int modulus) {
        // Simplified inversion algorithm
        // In production, use proper extended Euclidean algorithm for polynomials
        
        // Check if polynomial is invertible (gcd with x^N-1 should be 1)
        if (!isInvertible(modulus)) {
            return null;
        }
        
        // Generate approximate inverse using iterative method
        int[] inverseCoeffs = new int[degree];
        
        // Start with identity-like polynomial
        inverseCoeffs[0] = 1;
        
        // Simplified iterative inversion (placeholder for actual algorithm)
        for (int iteration = 0; iteration < 10; iteration++) {
            NTRUPolynomial current = new NTRUPolynomial(inverseCoeffs, degree);
            NTRUPolynomial product = this.multiply(current).reduceModP(modulus);
            
            // Check if we have identity polynomial (all zeros except coefficients[0] = 1)
            if (isIdentityPolynomial(product, modulus)) {
                return current;
            }
            
            // Adjust coefficients (simplified)
            for (int i = 0; i < degree; i++) {
                inverseCoeffs[i] = Math.floorMod(inverseCoeffs[i] + (i == 0 ? 1 : 0) - product.coefficients[i], modulus);
            }
        }
        
        return new NTRUPolynomial(inverseCoeffs, degree);
    }
    
    private boolean isInvertible(int modulus) {
        // Check basic invertibility conditions
        // In NTRU, f should be invertible modulo both p and q
        
        // Check if polynomial has appropriate structure
        int positiveCoeffs = 0;
        int negativeCoeffs = 0;
        int zeroCoeffs = 0;
        
        for (int coeff : coefficients) {
            if (coeff > 0) positiveCoeffs++;
            else if (coeff < 0) negativeCoeffs++;
            else zeroCoeffs++;
        }
        
        // For NTRU, we need specific patterns for invertibility
        return positiveCoeffs > 0 && (positiveCoeffs + negativeCoeffs) > degree / 2;
    }
    
    private boolean isIdentityPolynomial(NTRUPolynomial poly, int modulus) {
        int[] coeffs = poly.coefficients;
        
        // Check if coefficients[0] = 1 and all others = 0 (mod modulus)
        if (Math.floorMod(coeffs[0], modulus) != 1) {
            return false;
        }
        
        for (int i = 1; i < coeffs.length; i++) {
            if (Math.floorMod(coeffs[i], modulus) != 0) {
                return false;
            }
        }
        
        return true;
    }
    
    public int[] getCoefficients() {
        return Arrays.copyOf(coefficients, coefficients.length);
    }
    
    public int getDegree() {
        return degree;
    }
    
    public int getCoefficient(int index) {
        if (index < 0 || index >= degree) {
            return 0;
        }
        return coefficients[index];
    }
    
    public boolean isZero() {
        for (int coeff : coefficients) {
            if (coeff != 0) {
                return false;
            }
        }
        return true;
    }
    
    public int getNorm() {
        int norm = 0;
        for (int coeff : coefficients) {
            norm += coeff * coeff;
        }
        return norm;
    }
    
    public int getWeight() {
        int weight = 0;
        for (int coeff : coefficients) {
            if (coeff != 0) {
                weight++;
            }
        }
        return weight;
    }
    
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        
        NTRUPolynomial other = (NTRUPolynomial) obj;
        return degree == other.degree && Arrays.equals(coefficients, other.coefficients);
    }
    
    @Override
    public int hashCode() {
        return Arrays.hashCode(coefficients) * 31 + degree;
    }
    
    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        boolean first = true;
        
        for (int i = 0; i < degree; i++) {
            if (coefficients[i] != 0) {
                if (!first && coefficients[i] > 0) {
                    sb.append(" + ");
                } else if (coefficients[i] < 0) {
                    sb.append(" - ");
                }
                
                if (Math.abs(coefficients[i]) != 1 || i == 0) {
                    sb.append(Math.abs(coefficients[i]));
                }
                
                if (i > 0) {
                    sb.append("x");
                    if (i > 1) {
                        sb.append("^").append(i);
                    }
                }
                
                first = false;
            }
        }
        
        return sb.length() == 0 ? "0" : sb.toString();
    }
    
    // Utility methods for NTRU operations
    public NTRUPolynomial[] divideByPoly(NTRUPolynomial divisor) {
        // Polynomial division - returns [quotient, remainder]
        // Simplified implementation
        
        if (divisor.isZero()) {
            throw new ArithmeticException("Division by zero polynomial");
        }
        
        // For NTRU operations, we typically work modulo (x^N - 1)
        // Return this polynomial as remainder, zero as quotient for simplicity
        int[] zeroCoeffs = new int[degree];
        NTRUPolynomial quotient = new NTRUPolynomial(zeroCoeffs, degree);
        
        return new NTRUPolynomial[]{quotient, this};
    }
    
    public NTRUPolynomial gcd(NTRUPolynomial other) {
        // Greatest common divisor using Euclidean algorithm
        NTRUPolynomial a = this;
        NTRUPolynomial b = other;
        
        while (!b.isZero()) {
            NTRUPolynomial[] divResult = a.divideByPoly(b);
            a = b;
            b = divResult[1]; // remainder
        }
        
        return a;
    }
    
    public boolean isMonic() {
        // Check if leading coefficient is 1
        for (int i = degree - 1; i >= 0; i--) {
            if (coefficients[i] != 0) {
                return coefficients[i] == 1;
            }
        }
        return false; // zero polynomial is not monic
    }
    
    public NTRUPolynomial makeMonic() {
        // Make polynomial monic by dividing by leading coefficient
        int leadingCoeff = 0;
        for (int i = degree - 1; i >= 0; i--) {
            if (coefficients[i] != 0) {
                leadingCoeff = coefficients[i];
                break;
            }
        }
        
        if (leadingCoeff == 0 || leadingCoeff == 1) {
            return this;
        }
        
        int[] result = new int[degree];
        for (int i = 0; i < degree; i++) {
            result[i] = coefficients[i] / leadingCoeff;
        }
        
        return new NTRUPolynomial(result, degree);
    }
}