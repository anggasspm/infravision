import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';
import 'dart:io';
import '../services/api_service.dart';
import 'report_detail_screen.dart';

const List<String> kCategories = [
  'Jalan Berlubang',
  'Retak Jalan/Bangunan',
  'Lampu Jalan Rusak',
  'Saluran Air Tersumbat',
  'Trotoar Rusak',
  'Lainnya',
];

class SubmitReportScreen extends StatefulWidget {
  const SubmitReportScreen({super.key});

  @override
  State<SubmitReportScreen> createState() => _SubmitReportScreenState();
}

class _SubmitReportScreenState extends State<SubmitReportScreen> {
  final _descCtrl = TextEditingController();
  File?     _imageFile;
  String?   _category;
  Position? _position;
  bool      _loading    = false;
  bool      _gpsLoading = false;
  String    _error      = '';

  // ── Ambil foto ──────────────────────────────────────────────────────────────
  Future<void> _pickImage(ImageSource source) async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: source,
      imageQuality: 80,
      maxWidth: 1280,
    );
    if (picked != null) {
      setState(() => _imageFile = File(picked.path));
    }
  }

  void _showImageSourceSheet() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 12),
            ListTile(
              leading: const Icon(Icons.camera_alt_outlined),
              title: const Text('Ambil Foto'),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('Pilih dari Galeri'),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.gallery);
              },
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  // ── Ambil GPS ───────────────────────────────────────────────────────────────
  Future<void> _getLocation() async {
    setState(() { _gpsLoading = true; _error = ''; });
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) throw 'Aktifkan GPS di pengaturan perangkat';

      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.deniedForever) {
        throw 'Izin lokasi ditolak. Ubah di pengaturan aplikasi.';
      }

      final pos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      setState(() => _position = pos);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _gpsLoading = false);
    }
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  Future<void> _submit() async {
    setState(() => _error = '');

    if (_imageFile == null) {
      setState(() => _error = 'Foto kerusakan wajib diupload');
      return;
    }
    if (_descCtrl.text.trim().isEmpty) {
      setState(() => _error = 'Deskripsi tidak boleh kosong');
      return;
    }
    if (_position == null) {
      setState(() => _error = 'Lokasi GPS belum diambil');
      return;
    }

    setState(() => _loading = true);
    try {
      // 1. Upload gambar ke Cloudinary
      final imageUrl = await ApiService.uploadImage(_imageFile!.path);

      // 2. Kirim laporan ke backend
      final report = await ApiService.createReport(
        description: _descCtrl.text.trim(),
        imageUrl: imageUrl,
        latitude: _position!.latitude,
        longitude: _position!.longitude,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Laporan berhasil dikirim!'),
            backgroundColor: Color(0xFF22C55E),
          ),
        );
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => ReportDetailScreen(reportId: report['id']),
          ),
        );
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _descCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Buat Laporan')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [

              // Error banner
              if (_error.isNotEmpty) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFFCA5A5)),
                  ),
                  child: Text(_error,
                      style: const TextStyle(
                          color: Color(0xFFDC2626), fontSize: 13)),
                ),
              ],

              // Foto
              const _Label('Foto Kerusakan'),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: _showImageSourceSheet,
                child: Container(
                  height: 200,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _imageFile != null
                          ? const Color(0xFF3B82F6)
                          : const Color(0xFFE2E8F0),
                      width: _imageFile != null ? 2 : 1,
                    ),
                  ),
                  child: _imageFile != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.file(_imageFile!, fit: BoxFit.cover),
                        )
                      : const Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.add_photo_alternate_outlined,
                                size: 44, color: Color(0xFF94A3B8)),
                            SizedBox(height: 8),
                            Text('Ketuk untuk ambil foto',
                                style: TextStyle(
                                    color: Color(0xFF94A3B8), fontSize: 13)),
                          ],
                        ),
                ),
              ),
              const SizedBox(height: 20),

              // Deskripsi
              const _Label('Deskripsi Kerusakan'),
              const SizedBox(height: 8),
              TextField(
                controller: _descCtrl,
                maxLines: 4,
                decoration: const InputDecoration(
                  hintText: 'Jelaskan kondisi kerusakan secara singkat...',
                  alignLabelWithHint: true,
                ),
              ),
              const SizedBox(height: 20),

              // Kategori
              const _Label('Kategori'),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                value: _category,
                decoration: const InputDecoration(hintText: '-- Pilih Kategori --'),
                items: kCategories
                    .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                    .toList(),
                onChanged: (v) => setState(() => _category = v),
              ),
              const SizedBox(height: 20),

              // Lokasi GPS
              const _Label('Lokasi GPS'),
              const SizedBox(height: 8),
              Row(
                children: [
                  OutlinedButton.icon(
                    onPressed: _gpsLoading ? null : _getLocation,
                    icon: _gpsLoading
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.my_location, size: 18),
                    label: Text(
                        _gpsLoading ? 'Mengambil...' : 'Ambil Lokasi'),
                  ),
                  const SizedBox(width: 12),
                  if (_position != null)
                    Expanded(
                      child: Text(
                        '${_position!.latitude.toStringAsFixed(5)},\n${_position!.longitude.toStringAsFixed(5)}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF22C55E),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 32),

              // Submit
              ElevatedButton(
                onPressed: _loading ? null : _submit,
                child: _loading
                    ? const SizedBox(
                        height: 20, width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text('Kirim Laporan',
                        style: TextStyle(
                            fontSize: 15, fontWeight: FontWeight.w600)),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
    );
  }
}