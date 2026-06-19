import 'package:flutter/material.dart';
import '../services/api_service.dart';

const Map<String, String> kStatusLabels = {
  'pending':      'Menunggu',
  'verified':     'Diverifikasi',
  'assigned':     'Ditugaskan',
  'in_progress':  'Dalam Proses',
  'under_repair': 'Sedang Diperbaiki',
  'completed':    'Selesai',
};

const Map<String, Color> kStatusColors = {
  'pending':      Color(0xFF94A3B8),
  'verified':     Color(0xFF3B82F6),
  'assigned':     Color(0xFF8B5CF6),
  'in_progress':  Color(0xFFF59E0B),
  'under_repair': Color(0xFFF97316),
  'completed':    Color(0xFF22C55E),
};

const Map<String, Color> kSeverityColors = {
  'low':      Color(0xFF22C55E),
  'medium':   Color(0xFFF59E0B),
  'high':     Color(0xFFF97316),
  'critical': Color(0xFFEF4444),
};

const List<String> kValidStatuses = [
  'pending', 'verified', 'assigned',
  'in_progress', 'under_repair', 'completed',
];

class ReportDetailScreen extends StatefulWidget {
  final String reportId;
  const ReportDetailScreen({super.key, required this.reportId});

  @override
  State<ReportDetailScreen> createState() => _ReportDetailScreenState();
}

class _ReportDetailScreenState extends State<ReportDetailScreen> {
  Map<String, dynamic>? _report;
  bool   _loading  = true;
  bool   _updating = false;
  String _error    = '';
  String? _userRole;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    final user = await ApiService.getSavedUser();
    _userRole = user?['role'];
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() { _loading = true; _error = ''; });
    try {
      final data = await ApiService.getReportDetail(widget.reportId);
      setState(() => _report = data);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _updateStatus(String newStatus) async {
    setState(() => _updating = true);
    try {
      await ApiService.updateStatus(widget.reportId, newStatus);
      await _fetch();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                'Status diubah ke "${kStatusLabels[newStatus] ?? newStatus}"'),
            backgroundColor: const Color(0xFF22C55E),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString()),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
    } finally {
      setState(() => _updating = false);
    }
  }

  void _showStatusPicker() {
    final currentStatus = _report?['status'] ?? '';
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: Text('Ubah Status',
                  style: TextStyle(
                      fontSize: 16, fontWeight: FontWeight.w600)),
            ),
            const Divider(),
            ...kValidStatuses.map((s) {
              final isActive = s == currentStatus;
              final color    = kStatusColors[s] ?? const Color(0xFF94A3B8);
              return ListTile(
                leading: Icon(
                  isActive ? Icons.radio_button_checked : Icons.radio_button_off,
                  color: isActive ? color : const Color(0xFFCBD5E1),
                ),
                title: Text(
                  kStatusLabels[s] ?? s,
                  style: TextStyle(
                    fontWeight:
                        isActive ? FontWeight.w600 : FontWeight.normal,
                    color: isActive ? color : null,
                  ),
                ),
                onTap: isActive
                    ? null
                    : () {
                        Navigator.pop(context);
                        _updateStatus(s);
                      },
              );
            }),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Detail Laporan'),
        actions: [
          if (!_loading && _report != null && _userRole != null &&
              (_userRole == 'admin' || _userRole == 'maintenance'))
            _updating
                ? const Padding(
                    padding: EdgeInsets.all(14),
                    child: SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  )
                : IconButton(
                    icon: const Icon(Icons.edit_outlined),
                    tooltip: 'Update Status',
                    onPressed: _showStatusPicker,
                  ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error.isNotEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(_error,
                          style: const TextStyle(color: Color(0xFFEF4444))),
                      const SizedBox(height: 12),
                      TextButton(
                          onPressed: _fetch, child: const Text('Coba Lagi')),
                    ],
                  ),
                )
              : SafeArea(
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Hero foto
                        Image.network(
                          _report!['image_url'] ?? '',
                          width: double.infinity,
                          height: 220,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            height: 220,
                            color: const Color(0xFFF1F5F9),
                            child: const Center(
                              child: Icon(Icons.broken_image_outlined,
                                  size: 48, color: Color(0xFFCBD5E1)),
                            ),
                          ),
                        ),

                        Padding(
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Status + Severity badges
                              Row(
                                children: [
                                  _StatusBadge(status: _report!['status']),
                                  const SizedBox(width: 8),
                                  if (_report!['severity'] != null)
                                    _SeverityBadge(
                                        severity: _report!['severity']),
                                ],
                              ),
                              const SizedBox(height: 16),

                              // Deskripsi
                              const Text('Deskripsi',
                                  style: TextStyle(
                                      fontSize: 13,
                                      color: Color(0xFF94A3B8),
                                      fontWeight: FontWeight.w500)),
                              const SizedBox(height: 4),
                              Text(
                                _report!['description'] ?? '',
                                style: const TextStyle(
                                    fontSize: 15, height: 1.5),
                              ),
                              const SizedBox(height: 20),

                              // Info grid
                              _InfoGrid(report: _report!),
                              const SizedBox(height: 24),

                              // Riwayat status
                              const Text('Riwayat Status',
                                  style: TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w600)),
                              const SizedBox(height: 12),
                              _HistoryTimeline(
                                  history: List<dynamic>.from(
                                      _report!['history'] ?? [])),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
    );
  }
}

// ── Widgets helper ─────────────────────────────────────────────────────────────

class _StatusBadge extends StatelessWidget {
  final String? status;
  const _StatusBadge({this.status});

  @override
  Widget build(BuildContext context) {
    final s = status ?? 'pending';
    final color = kStatusColors[s] ?? const Color(0xFF94A3B8);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        kStatusLabels[s] ?? s,
        style: TextStyle(
          fontSize: 12,
          color: color,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _SeverityBadge extends StatelessWidget {
  final String? severity;
  const _SeverityBadge({this.severity});

  @override
  Widget build(BuildContext context) {
    final s = severity ?? 'low';
    final color = kSeverityColors[s] ?? const Color(0xFF94A3B8);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        s.toUpperCase(),
        style: TextStyle(
          fontSize: 12,
          color: color,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _InfoGrid extends StatelessWidget {
  final Map<String, dynamic> report;
  const _InfoGrid({required this.report});

  @override
  Widget build(BuildContext context) {
    final confidence = report['ai_confidence'] != null
        ? '${(report['ai_confidence'] * 100).toStringAsFixed(1)}%'
        : '—';
    final lat = report['latitude']?.toStringAsFixed(5) ?? '—';
    final lng = report['longitude']?.toStringAsFixed(5) ?? '—';
    final created = report['created_at'] != null
        ? _formatDate(report['created_at'])
        : '—';

    final items = [
      ('Kategori', report['category'] ?? '—'),
      ('AI Confidence', confidence),
      ('Priority Score', '${report['priority_score'] ?? '—'}'),
      ('Koordinat', '$lat, $lng'),
      ('Dibuat', created),
      ('Duplikat', report['is_duplicate'] == true ? 'Ya ⚠' : 'Tidak'),
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: items.map((item) {
          final isLast = item == items.last;
          return Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(item.$1,
                      style: const TextStyle(
                          fontSize: 13, color: Color(0xFF94A3B8))),
                  Flexible(
                    child: Text(
                      item.$2,
                      style: const TextStyle(
                          fontSize: 13, fontWeight: FontWeight.w500),
                      textAlign: TextAlign.right,
                    ),
                  ),
                ],
              ),
              if (!isLast) ...[
                const SizedBox(height: 8),
                const Divider(height: 1, color: Color(0xFFE2E8F0)),
                const SizedBox(height: 8),
              ],
            ],
          );
        }).toList(),
      ),
    );
  }

  String _formatDate(String raw) {
    try {
      final dt = DateTime.parse(raw).toLocal();
      final months = [
        '', 'Jan','Feb','Mar','Apr','Mei','Jun',
        'Jul','Agu','Sep','Okt','Nov','Des',
      ];
      return '${dt.day} ${months[dt.month]} ${dt.year}, ${dt.hour.toString().padLeft(2,'0')}:${dt.minute.toString().padLeft(2,'0')}';
    } catch (_) {
      return raw;
    }
  }
}

class _HistoryTimeline extends StatelessWidget {
  final List<dynamic> history;
  const _HistoryTimeline({required this.history});

  @override
  Widget build(BuildContext context) {
    if (history.isEmpty) {
      return const Text('Belum ada riwayat perubahan status.',
          style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8)));
    }

    return Column(
      children: List.generate(history.length, (i) {
        final h      = history[i] as Map<String, dynamic>;
        final isLast = i == history.length - 1;
        final cur    = h['current_status'] as String? ?? '';
        final prev   = h['previous_status'] as String?;
        final color  = kStatusColors[cur] ?? const Color(0xFF94A3B8);

        return IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Timeline line + dot
              Column(
                children: [
                  Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      color: color,
                      shape: BoxShape.circle,
                    ),
                  ),
                  if (!isLast)
                    Expanded(
                      child: Container(
                        width: 2,
                        color: const Color(0xFFE2E8F0),
                      ),
                    ),
                ],
              ),
              const SizedBox(width: 14),

              // Content
              Expanded(
                child: Padding(
                  padding: EdgeInsets.only(bottom: isLast ? 0 : 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        prev != null
                            ? '${kStatusLabels[prev] ?? prev} → ${kStatusLabels[cur] ?? cur}'
                            : kStatusLabels[cur] ?? cur,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: isLast
                              ? const Color(0xFF1E293B)
                              : const Color(0xFF64748B),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _formatDate(h['updated_at'] ?? ''),
                        style: const TextStyle(
                            fontSize: 11, color: Color(0xFF94A3B8)),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      }),
    );
  }

  String _formatDate(String raw) {
    try {
      final dt = DateTime.parse(raw).toLocal();
      final months = [
        '', 'Jan','Feb','Mar','Apr','Mei','Jun',
        'Jul','Agu','Sep','Okt','Nov','Des',
      ];
      return '${dt.day} ${months[dt.month]} ${dt.year}, ${dt.hour.toString().padLeft(2,'0')}:${dt.minute.toString().padLeft(2,'0')}';
    } catch (_) {
      return raw;
    }
  }
}