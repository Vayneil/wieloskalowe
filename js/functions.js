function distance(x1, x2, y1, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

function prob(kt, deltaE) {
    if (deltaE <= 0) return 1;
    else return Math.exp(-deltaE / kt);
}

function rho(a, b) {
    return a / b + (1 - a / b) * Math.exp(-b * 0.001);
}

export { distance, prob, rho };