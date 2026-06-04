"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useProject } from "@/hooks/use-projects";
import { useProjectAnalytics } from "@/hooks/use-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, RefreshCw } from "lucide-react";

function parseDollar(val: string): number {
  const n = parseFloat(val.replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? 0 : n;
}

function parsePercent(val: string): number {
  const n = parseFloat(val.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function fmt(n: number) {
  return formatCurrency(n);
}

function fmtPct(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

export default function EstimatedExitPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { project, isLoading } = useProject(projectId);
  const { data: analytics } = useProjectAnalytics(projectId);

  const [totalCost, setTotalCost] = useState("");
  const [noi, setNoi] = useState("");
  const [exitCapRate, setExitCapRate] = useState("");
  const [costOfSale, setCostOfSale] = useState("");
  const [loanPayoff, setLoanPayoff] = useState("");
  const [initialEquity, setInitialEquity] = useState("");
  const [otherCosts, setOtherCosts] = useState("");

  const handleUseCurrentCosts = () => {
    const actual = analytics?.budgetSummary?.actualCost;
    if (actual !== undefined) {
      setTotalCost(actual.toFixed(2));
    }
  };

  // Parsed values
  const tc = parseDollar(totalCost);
  const noiVal = parseDollar(noi);
  const capRate = parsePercent(exitCapRate);
  const cosPct = parsePercent(costOfSale);
  const loan = parseDollar(loanPayoff);
  const equity = parseDollar(initialEquity);
  const other = parseDollar(otherCosts);

  // Calculations
  const grossSalePrice = capRate > 0 && noiVal > 0 ? noiVal / (capRate / 100) : 0;
  const saleCostsAmt = grossSalePrice * (cosPct / 100);
  const netProceeds = grossSalePrice - saleCostsAmt - loan - other;
  const profit = netProceeds - tc;
  const returnOnCostPct = tc > 0 ? (profit / tc) * 100 : 0;
  const returnOnCostMultiple = tc > 0 ? netProceeds / tc : 0;
  const yieldOnCost = tc > 0 && noiVal > 0 ? (noiVal / tc) * 100 : 0;
  const equityMultiple = equity > 0 ? netProceeds / equity : 0;
  const equityReturnPct = equity > 0 ? ((netProceeds - equity) / equity) * 100 : 0;

  const hasResults = grossSalePrice > 0;

  if (isLoading || !project) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Exit Assumptions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Total Cost */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="ee-totalCost">Total Cost</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUseCurrentCosts}
                  disabled={!analytics?.budgetSummary}
                  className="h-7 text-xs gap-1.5"
                >
                  <RefreshCw className="h-3 w-3" />
                  Use Current Costs
                </Button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id="ee-totalCost"
                  value={totalCost}
                  onChange={(e) => setTotalCost(e.target.value)}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* NOI */}
            <div className="space-y-1.5">
              <Label htmlFor="ee-noi">Stabilized NOI (Annual)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id="ee-noi"
                  value={noi}
                  onChange={(e) => setNoi(e.target.value)}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Exit Cap Rate */}
            <div className="space-y-1.5">
              <Label htmlFor="ee-capRate">Exit Cap Rate</Label>
              <div className="relative">
                <Input
                  id="ee-capRate"
                  value={exitCapRate}
                  onChange={(e) => setExitCapRate(e.target.value)}
                  className="pr-8"
                  placeholder="5.00"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
            </div>

            {/* Cost of Sale */}
            <div className="space-y-1.5">
              <Label htmlFor="ee-cos">Cost of Sale</Label>
              <div className="relative">
                <Input
                  id="ee-cos"
                  value={costOfSale}
                  onChange={(e) => setCostOfSale(e.target.value)}
                  className="pr-8"
                  placeholder="2.00"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border pt-2">
              <p className="text-xs text-muted-foreground mb-3">Disposition</p>
              <div className="space-y-4">

                {/* Loan Payoff */}
                <div className="space-y-1.5">
                  <Label htmlFor="ee-loan">Loan Payoff</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      id="ee-loan"
                      value={loanPayoff}
                      onChange={(e) => setLoanPayoff(e.target.value)}
                      className="pl-7"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Initial Equity */}
                <div className="space-y-1.5">
                  <Label htmlFor="ee-equity">Initial Equity Invested</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      id="ee-equity"
                      value={initialEquity}
                      onChange={(e) => setInitialEquity(e.target.value)}
                      className="pl-7"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Other Exit Costs */}
                <div className="space-y-1.5">
                  <Label htmlFor="ee-other">Other Exit Costs</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      id="ee-other"
                      value={otherCosts}
                      onChange={(e) => setOtherCosts(e.target.value)}
                      className="pl-7"
                      placeholder="0.00"
                    />
                  </div>
                </div>

              </div>
            </div>

          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Estimated Returns
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!hasResults ? (
                <p className="text-sm text-muted-foreground">
                  Enter a stabilized NOI and exit cap rate to see estimated returns.
                </p>
              ) : (
                <div className="space-y-5">

                  {/* Proceeds waterfall */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gross Sale Price</span>
                      <span className="font-medium">{fmt(grossSalePrice)}</span>
                    </div>
                    {saleCostsAmt > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cost of Sale ({cosPct}%)</span>
                        <span className="text-destructive">({fmt(saleCostsAmt)})</span>
                      </div>
                    )}
                    {loan > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Loan Payoff</span>
                        <span className="text-destructive">({fmt(loan)})</span>
                      </div>
                    )}
                    {other > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Other Exit Costs</span>
                        <span className="text-destructive">({fmt(other)})</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-border pt-2 font-semibold text-base">
                      <span>Estimated Proceeds</span>
                      <span className={netProceeds >= 0 ? "text-emerald-400" : "text-destructive"}>
                        {fmt(netProceeds)}
                      </span>
                    </div>
                  </div>

                  {/* Key metrics */}
                  <div className="space-y-2 pt-1">

                    {/* Return on Cost */}
                    {tc > 0 && (
                      <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Return on Cost</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {fmt(profit)} profit on {fmt(tc)} invested
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-semibold ${returnOnCostPct >= 0 ? "text-emerald-400" : "text-destructive"}`}>
                            {fmtPct(returnOnCostPct)}
                          </p>
                          <p className="text-xs text-muted-foreground">{returnOnCostMultiple.toFixed(2)}x multiple</p>
                        </div>
                      </div>
                    )}

                    {/* Return of Initial Equity */}
                    {equity > 0 && (
                      <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Return of Initial Equity</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {fmt(netProceeds - equity)} equity profit on {fmt(equity)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-semibold ${equityReturnPct >= 0 ? "text-emerald-400" : "text-destructive"}`}>
                            {fmtPct(equityReturnPct)}
                          </p>
                          <p className="text-xs text-muted-foreground">{equityMultiple.toFixed(2)}x multiple</p>
                        </div>
                      </div>
                    )}

                    {/* Yield on Cost */}
                    {tc > 0 && noiVal > 0 && (
                      <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Yield on Cost</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {fmt(noiVal)} NOI on {fmt(tc)} cost
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-semibold text-sky-400">
                            {yieldOnCost.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
