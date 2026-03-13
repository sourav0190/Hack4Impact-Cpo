pragma circom 2.0.0;

include "node_modules/circomlib/circuits/comparators.circom";

template CGPAVerify() {
    // Private input: actual CGPA (multiplied by 100 to handle 2 decimal places)
    signal input cgpa;
    // Public input: threshold (multiplied by 100)
    signal input threshold;
    // Public output: 1 if cgpa >= threshold, 0 otherwise
    signal output out;

    // Use GreaterEqThan comparator
    // We assume CGPA is between 0 and 1000 (0.00 to 10.00)
    // 14 bits can hold up to 16383, which is enough for 1000
    component geq = GreaterEqThan(14);
    geq.in[0] <== cgpa;
    geq.in[1] <== threshold;

    out <== geq.out;
}

component main { public [threshold] } = CGPAVerify();
