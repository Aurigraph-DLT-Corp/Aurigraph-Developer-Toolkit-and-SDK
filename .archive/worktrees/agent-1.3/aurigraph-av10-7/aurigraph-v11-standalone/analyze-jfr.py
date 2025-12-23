#!/usr/bin/env python3
"""
Aurigraph V11 - JFR Performance Analysis Script
Automated analysis and comparison of Java Flight Recorder profiles

Usage:
  python3 analyze-jfr.py <jfr-file>
  python3 analyze-jfr.py --compare baseline.jfr optimized.jfr
  python3 analyze-jfr.py --report sprint13-week1-profile.jfr

Requirements:
  - JDK 21+ with jfr command-line tool
  - Python 3.8+
"""

import subprocess
import sys
import json
import re
from collections import Counter, defaultdict
from typing import Dict, List, Tuple
from dataclasses import dataclass
from datetime import datetime


@dataclass
class JFRMetrics:
    """Performance metrics extracted from JFR profile"""
    file_path: str

    # GC metrics
    total_gc_events: int = 0
    young_gc_count: int = 0
    old_gc_count: int = 0
    total_pause_time: float = 0.0
    avg_pause: float = 0.0
    max_pause: float = 0.0
    min_pause: float = 0.0

    # CPU metrics
    total_samples: int = 0
    virtual_thread_samples: int = 0
    forkjoin_samples: int = 0
    application_samples: int = 0

    # Allocation metrics
    total_allocations: int = 0
    allocation_weight_mb: float = 0.0
    allocation_rate_mbs: float = 0.0

    # Contention metrics
    monitor_enter_events: int = 0
    monitor_wait_events: int = 0
    total_contention_time: float = 0.0

    # Duration
    recording_duration: int = 0

    def virtual_thread_percent(self) -> float:
        if self.total_samples == 0:
            return 0.0
        return (self.virtual_thread_samples / self.total_samples) * 100

    def application_cpu_percent(self) -> float:
        if self.total_samples == 0:
            return 0.0
        return (self.application_samples / self.total_samples) * 100

    def gc_throughput_loss(self) -> float:
        if self.recording_duration == 0:
            return 0.0
        return (self.total_pause_time / (self.recording_duration * 1000)) * 100


def run_jfr_command(jfr_file: str, events: str) -> str:
    """Execute jfr print command and return output"""
    try:
        result = subprocess.run(
            ["jfr", "print", "--events", events, jfr_file],
            capture_output=True,
            text=True,
            timeout=120
        )
        return result.stdout
    except subprocess.TimeoutExpired:
        print(f"ERROR: jfr command timed out for {events}", file=sys.stderr)
        return ""
    except FileNotFoundError:
        print("ERROR: jfr command not found. Ensure JDK 21+ is installed.", file=sys.stderr)
        sys.exit(1)


def parse_gc_metrics(output: str) -> Tuple[int, int, int, List[float]]:
    """Parse GC events from jfr output"""
    young_gc = 0
    old_gc = 0
    pauses = []

    for line in output.split('\n'):
        if 'name = "G1New"' in line:
            young_gc += 1
        elif 'name = "G1Old"' in line:
            old_gc += 1
        elif 'duration =' in line:
            duration_str = line.split('=')[1].strip().split()[0]
            try:
                pauses.append(float(duration_str))
            except ValueError:
                pass

    return young_gc, old_gc, len(pauses), pauses


def parse_execution_samples(output: str) -> Tuple[int, int, int, int]:
    """Parse execution samples from jfr output"""
    total_samples = 0
    virtual_thread_samples = 0
    forkjoin_samples = 0
    application_samples = 0

    for line in output.split('\n'):
        if 'sampledThread =' in line:
            total_samples += 1
            thread_name = line.split('"')[1] if '"' in line else ''

            if not thread_name:  # Unnamed virtual threads
                virtual_thread_samples += 1
            elif 'ForkJoinPool' in thread_name or 'VirtualThread' in thread_name:
                forkjoin_samples += 1
            elif 'executor-thread' in thread_name or thread_name.startswith('io.'):
                application_samples += 1

    return total_samples, virtual_thread_samples, forkjoin_samples, application_samples


def parse_allocations(output: str) -> Tuple[int, float]:
    """Parse allocation samples from jfr output"""
    total_allocations = 0
    total_weight_kb = 0.0
    current_class = None

    for line in output.split('\n'):
        if 'objectClass =' in line:
            current_class = line.split('=')[1].strip()
            total_allocations += 1
        elif 'weight =' in line and current_class:
            weight_str = line.split('=')[1].strip()
            try:
                if 'MB' in weight_str:
                    weight = float(weight_str.split()[0]) * 1024
                elif 'kB' in weight_str:
                    weight = float(weight_str.split()[0])
                elif 'bytes' in weight_str:
                    weight = float(weight_str.split()[0]) / 1024
                else:
                    weight = 0
                total_weight_kb += weight
            except ValueError:
                pass

    return total_allocations, total_weight_kb


def parse_contention(output: str) -> Tuple[int, int, float]:
    """Parse thread contention events from jfr output"""
    monitor_enter = 0
    monitor_wait = 0
    contention_durations = []

    for line in output.split('\n'):
        if 'jdk.JavaMonitorEnter {' in line:
            monitor_enter += 1
        elif 'jdk.JavaMonitorWait {' in line:
            monitor_wait += 1
        elif 'duration =' in line:
            duration_str = line.split('=')[1].strip()
            try:
                if 'm ' in duration_str:  # minutes
                    parts = duration_str.split()
                    minutes = float(parts[0])
                    seconds = float(parts[2]) if len(parts) > 2 else 0
                    duration = (minutes * 60 + seconds) * 1000
                elif ' s' in duration_str:  # seconds
                    duration = float(duration_str.split()[0]) * 1000
                elif ' ms' in duration_str:  # milliseconds
                    duration = float(duration_str.split()[0])
                else:
                    duration = 0
                if duration > 0:
                    contention_durations.append(duration)
            except ValueError:
                pass

    total_contention = sum(contention_durations) if contention_durations else 0.0
    return monitor_enter, monitor_wait, total_contention


def get_recording_duration(jfr_file: str) -> int:
    """Get recording duration from jfr summary"""
    try:
        result = subprocess.run(
            ["jfr", "summary", jfr_file],
            capture_output=True,
            text=True,
            timeout=30
        )
        for line in result.stdout.split('\n'):
            if 'Duration:' in line:
                duration_str = line.split(':')[1].strip().split()[0]
                return int(duration_str)
    except:
        pass
    return 0


def analyze_jfr(jfr_file: str) -> JFRMetrics:
    """Perform complete JFR analysis"""
    print(f"Analyzing {jfr_file}...")

    metrics = JFRMetrics(file_path=jfr_file)

    # Get recording duration
    metrics.recording_duration = get_recording_duration(jfr_file)
    print(f"  Recording duration: {metrics.recording_duration}s")

    # Analyze GC
    print("  Analyzing garbage collection...")
    gc_output = run_jfr_command(jfr_file, "jdk.GarbageCollection")
    young, old, total, pauses = parse_gc_metrics(gc_output)
    metrics.young_gc_count = young
    metrics.old_gc_count = old
    metrics.total_gc_events = total
    if pauses:
        metrics.total_pause_time = sum(pauses)
        metrics.avg_pause = sum(pauses) / len(pauses)
        metrics.max_pause = max(pauses)
        metrics.min_pause = min(pauses)

    # Analyze CPU
    print("  Analyzing CPU samples...")
    exec_output = run_jfr_command(jfr_file, "jdk.ExecutionSample")
    total, vt, fj, app = parse_execution_samples(exec_output)
    metrics.total_samples = total
    metrics.virtual_thread_samples = vt + fj
    metrics.forkjoin_samples = fj
    metrics.application_samples = app

    # Analyze allocations
    print("  Analyzing allocations...")
    alloc_output = run_jfr_command(jfr_file, "jdk.ObjectAllocationSample")
    alloc_count, alloc_weight_kb = parse_allocations(alloc_output)
    metrics.total_allocations = alloc_count
    metrics.allocation_weight_mb = alloc_weight_kb / 1024
    if metrics.recording_duration > 0:
        metrics.allocation_rate_mbs = metrics.allocation_weight_mb / metrics.recording_duration

    # Analyze contention
    print("  Analyzing thread contention...")
    contention_output = run_jfr_command(jfr_file, "jdk.JavaMonitorEnter,jdk.JavaMonitorWait")
    enter, wait, total_time = parse_contention(contention_output)
    metrics.monitor_enter_events = enter
    metrics.monitor_wait_events = wait
    metrics.total_contention_time = total_time

    print(f"  Analysis complete.\n")
    return metrics


def print_metrics_report(metrics: JFRMetrics):
    """Print detailed metrics report"""
    print("=" * 80)
    print(f"JFR PERFORMANCE ANALYSIS REPORT")
    print("=" * 80)
    print(f"File: {metrics.file_path}")
    print(f"Duration: {metrics.recording_duration}s ({metrics.recording_duration/60:.1f} minutes)")
    print(f"Analyzed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    print("GARBAGE COLLECTION METRICS")
    print("-" * 80)
    print(f"  Total GC Events:        {metrics.total_gc_events}")
    print(f"  Young Gen (G1New):      {metrics.young_gc_count} ({metrics.young_gc_count/metrics.total_gc_events*100:.1f}%)" if metrics.total_gc_events > 0 else "  Young Gen: N/A")
    print(f"  Old Gen (G1Old):        {metrics.old_gc_count} ({metrics.old_gc_count/metrics.total_gc_events*100:.1f}%)" if metrics.total_gc_events > 0 else "  Old Gen: N/A")
    print(f"  Total Pause Time:       {metrics.total_pause_time:.2f} ms ({metrics.total_pause_time/1000:.2f}s)")
    print(f"  Average Pause:          {metrics.avg_pause:.2f} ms")
    print(f"  Max Pause:              {metrics.max_pause:.2f} ms")
    print(f"  Min Pause:              {metrics.min_pause:.2f} ms")
    print(f"  Throughput Loss:        {metrics.gc_throughput_loss():.2f}%")
    print()

    print("CPU EXECUTION METRICS")
    print("-" * 80)
    print(f"  Total Execution Samples:    {metrics.total_samples}")
    print(f"  Virtual Thread Samples:     {metrics.virtual_thread_samples} ({metrics.virtual_thread_percent():.2f}%)")
    print(f"  ForkJoinPool Samples:       {metrics.forkjoin_samples} ({metrics.forkjoin_samples/metrics.total_samples*100:.2f}%)" if metrics.total_samples > 0 else "  ForkJoinPool: N/A")
    print(f"  Application CPU:            {metrics.application_samples} samples ({metrics.application_cpu_percent():.2f}%)")
    print()

    print("MEMORY ALLOCATION METRICS")
    print("-" * 80)
    print(f"  Total Allocation Samples:   {metrics.total_allocations}")
    print(f"  Total Allocated:            {metrics.allocation_weight_mb:.2f} MB ({metrics.allocation_weight_mb/1024:.2f} GB)")
    print(f"  Allocation Rate:            {metrics.allocation_rate_mbs:.2f} MB/s")
    print()

    print("THREAD CONTENTION METRICS")
    print("-" * 80)
    print(f"  Monitor Enter Events:       {metrics.monitor_enter_events}")
    print(f"  Monitor Wait Events:        {metrics.monitor_wait_events}")
    print(f"  Total Contention Time:      {metrics.total_contention_time:.2f} ms ({metrics.total_contention_time/1000/60:.2f} min)")
    print()

    print("PERFORMANCE ASSESSMENT")
    print("-" * 80)

    # Virtual thread overhead check
    if metrics.virtual_thread_percent() > 10:
        print(f"  ⚠️  HIGH virtual thread overhead: {metrics.virtual_thread_percent():.1f}% (target <5%)")
    else:
        print(f"  ✅ Virtual thread overhead acceptable: {metrics.virtual_thread_percent():.1f}%")

    # Application CPU check
    if metrics.application_cpu_percent() < 70:
        print(f"  ⚠️  LOW application CPU efficiency: {metrics.application_cpu_percent():.1f}% (target >80%)")
    else:
        print(f"  ✅ Application CPU efficiency good: {metrics.application_cpu_percent():.1f}%")

    # GC pause check
    if metrics.max_pause > 50:
        print(f"  ⚠️  HIGH GC pause detected: {metrics.max_pause:.1f}ms (target <50ms)")
    else:
        print(f"  ✅ GC pauses under control: {metrics.max_pause:.1f}ms")

    # Allocation rate check
    if metrics.allocation_rate_mbs > 5:
        print(f"  ⚠️  HIGH allocation rate: {metrics.allocation_rate_mbs:.2f} MB/s (target <5 MB/s)")
    else:
        print(f"  ✅ Allocation rate acceptable: {metrics.allocation_rate_mbs:.2f} MB/s")

    # Contention check
    if metrics.monitor_enter_events > 5:
        print(f"  ⚠️  Thread contention detected: {metrics.monitor_enter_events} blocking events (target 0)")
    else:
        print(f"  ✅ No significant thread contention")

    print("=" * 80)


def compare_metrics(baseline: JFRMetrics, optimized: JFRMetrics):
    """Compare two JFR profiles and show improvements"""
    print("=" * 80)
    print(f"JFR COMPARISON REPORT")
    print("=" * 80)
    print(f"Baseline:  {baseline.file_path}")
    print(f"Optimized: {optimized.file_path}")
    print()

    def pct_change(old, new):
        if old == 0:
            return 0.0
        return ((new - old) / old) * 100

    def format_change(old, new, unit="", higher_is_better=False):
        change = pct_change(old, new)
        arrow = "↑" if change > 0 else "↓"
        if not higher_is_better:
            arrow = "↓" if change > 0 else "↑"  # Invert for metrics where lower is better
        color = "✅" if (change < 0 and not higher_is_better) or (change > 0 and higher_is_better) else "⚠️"
        return f"{old:.2f}{unit} → {new:.2f}{unit} ({arrow}{abs(change):.1f}%) {color}"

    print("GARBAGE COLLECTION COMPARISON")
    print("-" * 80)
    print(f"  Total GC Events:    {baseline.total_gc_events} → {optimized.total_gc_events} ({pct_change(baseline.total_gc_events, optimized.total_gc_events):+.1f}%)")
    print(f"  Total Pause Time:   {format_change(baseline.total_pause_time, optimized.total_pause_time, 'ms', higher_is_better=False)}")
    print(f"  Max Pause:          {format_change(baseline.max_pause, optimized.max_pause, 'ms', higher_is_better=False)}")
    print(f"  Throughput Loss:    {format_change(baseline.gc_throughput_loss(), optimized.gc_throughput_loss(), '%', higher_is_better=False)}")
    print()

    print("CPU EXECUTION COMPARISON")
    print("-" * 80)
    print(f"  Virtual Thread %:   {format_change(baseline.virtual_thread_percent(), optimized.virtual_thread_percent(), '%', higher_is_better=False)}")
    print(f"  Application CPU %:  {format_change(baseline.application_cpu_percent(), optimized.application_cpu_percent(), '%', higher_is_better=True)}")
    print()

    print("MEMORY ALLOCATION COMPARISON")
    print("-" * 80)
    print(f"  Allocation Rate:    {format_change(baseline.allocation_rate_mbs, optimized.allocation_rate_mbs, ' MB/s', higher_is_better=False)}")
    print(f"  Total Allocated:    {format_change(baseline.allocation_weight_mb, optimized.allocation_weight_mb, ' MB', higher_is_better=False)}")
    print()

    print("THREAD CONTENTION COMPARISON")
    print("-" * 80)
    print(f"  Monitor Enters:     {baseline.monitor_enter_events} → {optimized.monitor_enter_events} ({pct_change(baseline.monitor_enter_events, optimized.monitor_enter_events):+.1f}%)")
    print(f"  Monitor Waits:      {baseline.monitor_wait_events} → {optimized.monitor_wait_events} ({pct_change(baseline.monitor_wait_events, optimized.monitor_wait_events):+.1f}%)")
    print()

    print("OVERALL ASSESSMENT")
    print("-" * 80)

    improvements = []
    regressions = []

    if optimized.virtual_thread_percent() < baseline.virtual_thread_percent():
        improvements.append(f"Virtual thread overhead reduced by {abs(pct_change(baseline.virtual_thread_percent(), optimized.virtual_thread_percent())):.1f}%")
    else:
        regressions.append(f"Virtual thread overhead increased by {abs(pct_change(baseline.virtual_thread_percent(), optimized.virtual_thread_percent())):.1f}%")

    if optimized.max_pause < baseline.max_pause:
        improvements.append(f"Max GC pause reduced by {abs(pct_change(baseline.max_pause, optimized.max_pause)):.1f}%")
    else:
        regressions.append(f"Max GC pause increased by {abs(pct_change(baseline.max_pause, optimized.max_pause)):.1f}%")

    if optimized.allocation_rate_mbs < baseline.allocation_rate_mbs:
        improvements.append(f"Allocation rate reduced by {abs(pct_change(baseline.allocation_rate_mbs, optimized.allocation_rate_mbs)):.1f}%")
    else:
        regressions.append(f"Allocation rate increased by {abs(pct_change(baseline.allocation_rate_mbs, optimized.allocation_rate_mbs)):.1f}%")

    if optimized.monitor_enter_events < baseline.monitor_enter_events:
        improvements.append(f"Thread contention reduced by {abs(pct_change(baseline.monitor_enter_events, optimized.monitor_enter_events)):.1f}%")

    if improvements:
        print("  ✅ IMPROVEMENTS:")
        for imp in improvements:
            print(f"     • {imp}")

    if regressions:
        print()
        print("  ⚠️  REGRESSIONS:")
        for reg in regressions:
            print(f"     • {reg}")

    if not regressions:
        print()
        print("  🎉 ALL METRICS IMPROVED!")

    print("=" * 80)


def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python3 analyze-jfr.py <jfr-file>")
        print("  python3 analyze-jfr.py --compare baseline.jfr optimized.jfr")
        sys.exit(1)

    if sys.argv[1] == "--compare":
        if len(sys.argv) != 4:
            print("ERROR: --compare requires two JFR files")
            print("Usage: python3 analyze-jfr.py --compare baseline.jfr optimized.jfr")
            sys.exit(1)

        baseline_metrics = analyze_jfr(sys.argv[2])
        optimized_metrics = analyze_jfr(sys.argv[3])
        compare_metrics(baseline_metrics, optimized_metrics)
    else:
        metrics = analyze_jfr(sys.argv[1])
        print_metrics_report(metrics)


if __name__ == "__main__":
    main()
