import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'report_detail_screen.dart';

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

class MyReportsScreen extends StatefulWidget {
  const MyReportsScreen({super.key});

  @override
  State<MyReportsScreen> createState() => _MyReportsScreenState();
}

class _MyReportsScreenState extends State<MyReportsScreen> {
  List<dynamic> _reports  = [];
  bool          _loading  = true;
  String        _error    = '';
  String        _status   = '';
  int           _page     = 1;
  int           _total    = 0;
  final int     _pageSize = 10;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch({bool reset = false}) async {
    if (reset) { _page = 1; _reports = []; }
    setState(() { _loading = true; _error = ''; });
    try {
      final data = await ApiService.getReports(
        page: _page,
        pageSize: _pageSize,
        status: _status.isEmpty ? null : _status,
      );
      setState(() {
        _total   = data['total'] ?? 0;
        _reports = List<dynamic>.from(data['items'] ?? []);
      });
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Laporan Saya')),
      body: Column(
        children: [
          // Filter bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: DropdownButtonFormField<String>(
              value: _status.isEmpty ? null : _status,
              decoration: const InputDecoration(
                hintText: 'Semua Status',
                isDense: true,
                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              ),
              items: [
                const DropdownMenuItem(value: '', child: Text('Semua Status')),
                ...kStatusLabels.entries.map(
                  (e) => DropdownMenuItem(value: e.key, child: Text(e.value)),
                ),
              ],
              onChanged: (v) {
                _status = v ?? '';
                _fetch(reset: true);
              },
            ),
          ),
          const SizedBox(height: 8),

          // Total info
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text('Total: $_total laporan',
                  style: const TextStyle(
                      fontSize: 12, color: Color(0xFF94A3B8))),
            ),
          ),
          const SizedBox(height: 4),

          // List
          Expanded(
            child: _loading
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
                    : _reports.isEmpty
                        ? const Center(
                            child: Text('Belum ada laporan',
                                style: TextStyle(color: Color(0xFF94A3B8))),
                          )
                        : RefreshIndicator(
                            onRefresh: () => _fetch(reset: true),
                            child: ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: _reports.length,
                              separatorBuilder: (_, __) =>
                                  const SizedBox(height: 10),
                              itemBuilder: (_, i) =>
                                  _ReportCard(report: _reports[i]),
                            ),
                          ),
          ),

          // Pagination
          if (!_loading && _error.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  TextButton(
                    onPressed: _page > 1
                        ? () { _page--; _fetch(); }
                        : null,
                    child: const Text('← Sebelumnya'),
                  ),
                  Text('Hal $_page',
                      style: const TextStyle(
                          fontSize: 13, color: Color(0xFF64748B))),
                  TextButton(
                    onPressed: _page * _pageSize < _total
                        ? () { _page++; _fetch(); }
                        : null,
                    child: const Text('Berikutnya →'),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _ReportCard extends StatelessWidget {
  final Map<String, dynamic> report;
  const _ReportCard({required this.report});

  @override
  Widget build(BuildContext context) {
    final status = report['status'] as String? ?? 'pending';
    final color  = kStatusColors[status] ?? const Color(0xFF94A3B8);
    final label  = kStatusLabels[status] ?? status;

    return InkWell(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => ReportDetailScreen(reportId: report['id']),
        ),
      ),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            // Thumbnail
            ClipRRect(
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(12),
                bottomLeft: Radius.circular(12),
              ),
              child: Image.network(
                report['image_url'] ?? '',
                width: 88,
                height: 88,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  width: 88,
                  height: 88,
                  color: const Color(0xFFF1F5F9),
                  child: const Icon(Icons.broken_image_outlined,
                      color: Color(0xFFCBD5E1)),
                ),
              ),
            ),
            const SizedBox(width: 12),

            // Info
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      report['category'] ?? 'Tidak diketahui',
                      style: const TextStyle(
                          fontSize: 14, fontWeight: FontWeight.w600),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      report['description'] ?? '',
                      style: const TextStyle(
                          fontSize: 12, color: Color(0xFF64748B)),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: color.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        label,
                        style: TextStyle(
                          fontSize: 11,
                          color: color,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const Padding(
              padding: EdgeInsets.only(right: 12),
              child: Icon(Icons.chevron_right,
                  color: Color(0xFFCBD5E1), size: 20),
            ),
          ],
        ),
      ),
    );
  }
}